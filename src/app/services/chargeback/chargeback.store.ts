import { Injectable, computed, inject, signal } from '@angular/core';

import { CLOCK } from '../../shared/clock';
import { createChargebackFixtures } from './chargeback.fixtures';
import {
  ChallengeDraft,
  ChargebackCase,
  ChargebackStatus,
  TimelineEvent,
} from './chargeback.types';
import { getAllowedActions, roundMoney } from './chargeback.utils';

export interface SubmitResponseInput {
  readonly challengedAmount: number;
  readonly documentIds: readonly string[];
}

export type SaveDraftInput = Omit<ChallengeDraft, 'savedAt'>;

type TimelineEventInput = Omit<TimelineEvent, 'id' | 'occurredAt' | 'cycle'>;

@Injectable({ providedIn: 'root' })
export class ChargebackStore {
  private readonly clock = inject(CLOCK);
  private readonly state = signal<readonly ChargebackCase[]>(this.createInitialCases());

  readonly cases = this.state.asReadonly();
  readonly count = computed(() => this.state().length);

  getById(caseId: string): ChargebackCase | undefined {
    return this.state().find((chargeback) => chargeback.caseId === caseId);
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
          worldpayTerm: 'Merchant Accepts Liability',
        },
      ),
    );
  }

  saveDraft(caseId: string, draft: SaveDraftInput): void {
    this.updateCase(caseId, (chargeback) => ({
      ...this.withStatus(chargeback, 'evidence-required'),
      draft: { ...draft, savedAt: this.clock.now().toISOString() },
    }));
  }

  submitResponse(caseId: string, input: SubmitResponseInput): void {
    this.updateCase(caseId, (chargeback) => {
      const credit = chargeback.network === 'visa' ? undefined : input.challengedAmount;
      return this.withEvent(
        {
          ...this.withStatus(chargeback, 'response-submitted'),
          replyByDate: undefined,
          draft: undefined,
          worldpayNote: undefined,
          challengedAmount: input.challengedAmount,
          amountCredited: roundMoney(chargeback.amountCredited + (credit ?? 0)),
        },
        {
          actor: 'merchant',
          title: 'Response sent to Worldpay',
          worldpayTerm: 'Represent',
          amountChange: credit,
          documentIds: input.documentIds,
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
