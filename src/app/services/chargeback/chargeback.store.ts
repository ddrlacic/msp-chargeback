import { Injectable, computed, inject, signal } from '@angular/core';

import { CLOCK } from '../../shared/clock';
import { createChargebackFixtures, FIXTURE_BRAND } from './chargeback.fixtures';
import {
  ArbitrationRuling,
  ChallengeDraft,
  ChallengeReason,
  ChargebackCase,
  ChargebackDocument,
  ChargebackDocumentType,
  ChargebackStatus,
  TimelineEvent,
} from './chargeback.types';
import {
  getAllowedActions,
  getAmountAtStake,
  getArbitrationFeeSchedule,
  getArbitrationFeeTotal,
  roundMoney,
} from './chargeback.utils';

export interface SubmitResponseInput {
  readonly reason: ChallengeReason;
  readonly challengedAmount: number;
  readonly documentIds: readonly string[];
  readonly note?: string;
}

export type SaveDraftInput = Omit<ChallengeDraft, 'savedAt'>;

export interface DocumentUploadInput {
  readonly name: string;
  readonly sizeBytes: number;
}

export const DOCUMENT_SCAN_MS = 2500;

type TimelineEventInput = Omit<TimelineEvent, 'id' | 'occurredAt' | 'cycle'>;

@Injectable({ providedIn: 'root' })
export class ChargebackStore {
  private readonly clock = inject(CLOCK);
  private readonly state = signal<readonly ChargebackCase[]>(this.createInitialCases());
  private uploadCount = 0;

  readonly cases = this.state.asReadonly();
  readonly count = computed(() => this.state().length);

  getById(caseId: string): ChargebackCase | undefined {
    return this.state().find((chargeback) => chargeback.caseId === caseId);
  }

  uploadDocuments(
    caseId: string,
    type: ChargebackDocumentType,
    files: readonly DocumentUploadInput[],
  ): readonly string[] {
    const createdDateTime = this.clock.now().toISOString();
    const documents: ChargebackDocument[] = files.map((file) => ({
      id: `${caseId}-upload-${++this.uploadCount}`,
      name: file.name,
      type,
      sizeBytes: file.sizeBytes,
      securityStatus: 'scanning',
      uploadedBy: FIXTURE_BRAND.userName,
      createdDateTime,
    }));
    const ids = documents.map((document) => document.id);
    this.updateCase(caseId, (chargeback) => ({
      ...chargeback,
      documents: [...chargeback.documents, ...documents],
    }));
    setTimeout(() => this.finishScan(caseId, ids), DOCUMENT_SCAN_MS);
    return ids;
  }

  deleteDocument(caseId: string, documentId: string): void {
    this.updateCase(caseId, (chargeback) => ({
      ...chargeback,
      documents: chargeback.documents.filter((document) => document.id !== documentId),
      draft: chargeback.draft && {
        ...chargeback.draft,
        documentIds: chargeback.draft.documentIds.filter((id) => id !== documentId),
      },
    }));
  }

  acceptChargeback(caseId: string): void {
    this.updateCase(caseId, (chargeback) =>
      this.withEvent(
        {
          ...this.withStatus(chargeback, 'accepted'),
          replyByDate: undefined,
          draft: undefined,
        },
        {
          actor: 'merchant',
          title: 'You accepted the chargeback',
          worldpayTerm: 'Merchant accepts liability',
        },
      ),
    );
  }

  saveDraft(caseId: string, draft: SaveDraftInput): void {
    this.updateCase(caseId, (chargeback) => ({
      ...(chargeback.status === 'pre-arbitration-response-required'
        ? chargeback
        : this.withStatus(chargeback, 'draft-not-submitted')),
      draft: { ...draft, savedAt: this.clock.now().toISOString() },
    }));
  }

  submitResponse(caseId: string, input: SubmitResponseInput): void {
    this.updateCase(caseId, (chargeback) => {
      const preArbitration = chargeback.status === 'pre-arbitration-response-required';
      const resubmitted = chargeback.status === 'returned-by-worldpay';
      const credit = preArbitration
        ? undefined
        : this.getResponseCredit(chargeback, input.challengedAmount, resubmitted);
      return this.withEvent(
        {
          ...this.withStatus(chargeback, preArbitration ? 'under-review' : 'response-submitted'),
          replyByDate: undefined,
          draft: undefined,
          worldpayNote: undefined,
          challengedAmount: input.challengedAmount,
          challengeReason: input.reason,
          challengeNote: input.note || undefined,
          amountCredited: roundMoney(chargeback.amountCredited + (credit ?? 0)),
        },
        {
          actor: 'merchant',
          title: this.getResponseTitle(preArbitration, resubmitted),
          worldpayTerm: 'Represent',
          description: input.note || undefined,
          amountChange: credit,
          documentIds: input.documentIds,
        },
      );
    });
  }

  requestArbitration(caseId: string): void {
    this.updateCase(caseId, (chargeback) =>
      this.withEvent(
        {
          ...this.withStatus(chargeback, 'arbitration'),
          cycle: 'arbitration',
          replyByDate: undefined,
        },
        {
          actor: 'merchant',
          title: 'You took the case to arbitration',
          worldpayTerm: 'Request arbitration',
        },
      ),
    );
  }

  recordArbitrationRuling(
    caseId: string,
    ruling: ArbitrationRuling,
    returnedAmount?: number,
  ): void {
    this.updateCase(caseId, (chargeback) => {
      const atStake = getAmountAtStake(chargeback);
      const closed: ChargebackCase = {
        ...this.withStatus(chargeback, ruling),
        cycle: 'arbitration',
        replyByDate: undefined,
      };
      if (ruling === 'lost') {
        const schedule = getArbitrationFeeSchedule(chargeback.network);
        const fees = schedule ? getArbitrationFeeTotal(schedule) : undefined;
        return this.withEvent(
          {
            ...closed,
            arbitrationFees: fees && roundMoney((chargeback.arbitrationFees ?? 0) + fees),
          },
          {
            actor: 'card-network',
            title: 'Resolved in the cardholder’s favor',
            worldpayTerm: 'Arbitration lost',
            arbitrationFees: fees,
          },
        );
      }
      const credit =
        ruling === 'won' ? atStake : roundMoney(Math.min(returnedAmount ?? atStake / 2, atStake));
      return this.withEvent(
        { ...closed, amountCredited: roundMoney(chargeback.amountCredited + credit) },
        {
          actor: 'card-network',
          title: ruling === 'won' ? 'Resolved in your favor' : 'Partially resolved in your favor',
          worldpayTerm: ruling === 'won' ? 'Arbitration won' : 'Arbitration split',
          amountChange: credit || undefined,
        },
      );
    });
  }

  setStatus(caseId: string, status: ChargebackStatus): void {
    this.updateCase(caseId, (chargeback) => this.withStatus(chargeback, status));
  }

  reset(): void {
    this.state.set(this.createInitialCases());
  }

  private createInitialCases(): readonly ChargebackCase[] {
    return createChargebackFixtures(this.clock.now());
  }

  private getResponseTitle(preArbitration: boolean, resubmitted: boolean): string {
    if (preArbitration) {
      return 'Pre-arbitration response sent to Worldpay';
    }
    return resubmitted ? 'Updated response sent to Worldpay' : 'Response sent to Worldpay';
  }

  private getResponseCredit(
    chargeback: ChargebackCase,
    challengedAmount: number,
    resubmitted: boolean,
  ): number | undefined {
    if (chargeback.network === 'visa') {
      return undefined;
    }
    const credit = roundMoney(
      Math.max(0, challengedAmount - (resubmitted ? chargeback.amountCredited : 0)),
    );
    return credit || undefined;
  }

  private finishScan(caseId: string, documentIds: readonly string[]): void {
    this.updateCase(caseId, (chargeback) => ({
      ...chargeback,
      documents: chargeback.documents.map((document) =>
        documentIds.includes(document.id) && document.securityStatus === 'scanning'
          ? { ...document, securityStatus: 'clean' }
          : document,
      ),
    }));
  }

  private updateCase(caseId: string, update: (chargeback: ChargebackCase) => ChargebackCase): void {
    this.state.update((cases) =>
      cases.map((chargeback) => (chargeback.caseId === caseId ? update(chargeback) : chargeback)),
    );
  }

  private withStatus(chargeback: ChargebackCase, status: ChargebackStatus): ChargebackCase {
    return { ...chargeback, status, allowedActions: getAllowedActions(status) };
  }

  private withEvent(chargeback: ChargebackCase, event: TimelineEventInput): ChargebackCase {
    const timelineEvent: TimelineEvent = {
      id: `${chargeback.caseId}-event-${chargeback.timeline.length + 1}`,
      occurredAt: this.clock.now().toISOString(),
      cycle: chargeback.cycle,
      ...event,
    };
    return { ...chargeback, timeline: [...chargeback.timeline, timelineEvent] };
  }
}
