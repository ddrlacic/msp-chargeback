import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
import { ChallengeReason, ChargebackDocument } from '../../../services/chargeback/chargeback.types';
import { CaseDocumentFilesService } from '../chargeback-case/case-document-files.service';
import { DocumentUploadRequest } from '../chargeback-case/case-upload-dialog/case-upload-dialog.component';
import {
  AmountChoice,
  createInitialState,
  getChallengedAmount,
  getEvidenceRows,
  getInitialStep,
  getRespondMode,
  getStepIndex,
  hasBlockedDocuments,
  hasScanningDocuments,
  RESPOND_STEPS,
  RespondMode,
  RespondStep,
  wasDocumentSent,
} from './chargeback-respond.utils';

@Injectable()
export class ChargebackRespondFlow {
  private readonly store = inject(ChargebackStore);
  private readonly files = inject(CaseDocumentFilesService);
  private settled = false;

  readonly caseId = signal('');
  readonly mode = signal<RespondMode>('challenge');
  readonly step = signal<RespondStep>('review');
  readonly reason = signal<ChallengeReason | undefined>(undefined);
  readonly amountChoice = signal<AmountChoice>('full');
  readonly amountText = signal('');
  readonly note = signal('');
  readonly documentIds = signal<readonly string[]>([]);
  readonly attempted = signal(false);

  readonly chargeback = computed(() => this.store.getById(this.caseId()));
  readonly fullAmount = computed(() => this.chargeback()?.chargebackAmount ?? 0);
  readonly currency = computed(() => this.chargeback()?.currency ?? 'USD');
  readonly challengedAmount = computed(() =>
    getChallengedAmount(this.amountChoice(), this.amountText(), this.fullAmount()),
  );
  readonly documents = computed<readonly ChargebackDocument[]>(() => {
    const available = this.chargeback()?.documents ?? [];
    return this.documentIds()
      .map((id) => available.find((document) => document.id === id))
      .filter((document): document is ChargebackDocument => document !== undefined);
  });
  readonly evidenceRows = computed(() => getEvidenceRows(this.reason(), this.documents()));
  readonly scanning = computed(() => hasScanningDocuments(this.documents()));
  readonly blocked = computed(() => hasBlockedDocuments(this.documents()));

  readonly reasonMissing = computed(() => this.reason() === undefined);
  readonly amountInvalid = computed(() => this.challengedAmount() === undefined);
  readonly noDocuments = computed(() => this.documents().length === 0);

  readonly valid = computed<Record<RespondStep, boolean>>(() => {
    const reason = !this.reasonMissing() && !this.amountInvalid();
    const evidence = !this.noDocuments() && !this.blocked();
    return {
      review: true,
      reason,
      evidence,
      submit: reason && evidence && !this.scanning(),
    };
  });

  readonly stepIndex = computed(() => getStepIndex(this.step()));
  readonly isFirst = computed(() => this.stepIndex() === 0);
  readonly isLast = computed(() => this.stepIndex() === RESPOND_STEPS.length - 1);

  readonly hasProgress = computed(
    () =>
      this.reason() !== undefined ||
      this.documentIds().length > 0 ||
      this.note().trim() !== '' ||
      (this.amountChoice() === 'partial' && this.amountText().trim() !== ''),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.saveOnLeave());
  }

  init(caseId: string): void {
    this.caseId.set(caseId);
    const chargeback = this.store.getById(caseId);
    if (!chargeback) {
      return;
    }
    const mode = getRespondMode(chargeback) ?? 'challenge';
    const state = createInitialState(chargeback);
    this.mode.set(mode);
    this.reason.set(state.reason);
    this.amountChoice.set(state.amountChoice);
    this.amountText.set(state.amountText);
    this.documentIds.set(state.documentIds);
    this.note.set(state.note);
    this.step.set(
      getInitialStep(mode, state, chargeback.chargebackAmount, chargeback.draft !== undefined),
    );
  }

  canOpen(step: RespondStep): boolean {
    return RESPOND_STEPS.slice(0, getStepIndex(step)).every((earlier) => this.valid()[earlier]);
  }

  goTo(step: RespondStep): boolean {
    if (!this.canOpen(step)) {
      return false;
    }
    this.attempted.set(false);
    this.step.set(step);
    return true;
  }

  next(): boolean {
    if (this.isLast()) {
      return false;
    }
    if (!this.valid()[this.step()]) {
      this.attempted.set(true);
      return false;
    }
    return this.goTo(RESPOND_STEPS[this.stepIndex() + 1]);
  }

  back(): boolean {
    return this.isFirst() ? false : this.goTo(RESPOND_STEPS[this.stepIndex() - 1]);
  }

  upload(request: DocumentUploadRequest): void {
    const caseId = this.caseId();
    const ids = this.store.uploadDocuments(
      caseId,
      request.type,
      request.files.map((file) => ({ name: file.name, sizeBytes: file.size })),
    );
    ids.forEach((id, index) => this.files.store(id, request.files[index]));
    this.documentIds.update((current) => [...current, ...ids]);
  }

  preview(document: ChargebackDocument): void {
    this.files.open(this.caseId(), document);
  }

  removeDocument(documentId: string): void {
    this.documentIds.update((current) => current.filter((id) => id !== documentId));
    const chargeback = this.chargeback();
    if (chargeback && !wasDocumentSent(chargeback, documentId)) {
      this.store.deleteDocument(this.caseId(), documentId);
    }
  }

  saveAndExit(): void {
    this.saveOnLeave();
    this.settled = true;
  }

  discard(): void {
    this.settled = true;
  }

  submit(): boolean {
    const reason = this.reason();
    const amount = this.challengedAmount();
    if (!this.valid().submit || reason === undefined || amount === undefined) {
      return false;
    }
    this.settled = true;
    this.store.submitResponse(this.caseId(), {
      reason,
      challengedAmount: amount,
      documentIds: this.documentIds(),
      note: this.note().trim() || undefined,
    });
    return true;
  }

  private saveOnLeave(): void {
    if (this.settled || this.mode() !== 'challenge' || !this.hasProgress()) {
      return;
    }
    const amount = this.challengedAmount();
    this.store.saveDraft(this.caseId(), {
      reason: this.reason(),
      challengedAmount: this.amountChoice() === 'partial' ? amount : undefined,
      documentIds: this.documentIds(),
      note: this.note().trim() || undefined,
    });
  }
}
