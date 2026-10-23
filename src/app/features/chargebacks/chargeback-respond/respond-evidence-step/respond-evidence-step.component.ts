import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  ChargebackDocument,
  ChargebackDocumentType,
} from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { formatDate, formatDateAtTime } from '../../../../shared/utils/date.utils';
import { formatFileSize, isImageFile } from '../../../../shared/utils/file.utils';
import {
  CHARGEBACK_DOCUMENT_STATUS_LABELS,
  CHARGEBACK_DOCUMENT_TYPE_LABELS,
  CHARGEBACKS_CONSTANTS,
} from '../../chargebacks.constants';
import {
  CaseUploadDialogComponent,
  DocumentUploadRequest,
} from '../../chargeback-case/case-upload-dialog/case-upload-dialog.component';
import { getMaxFileBytes } from '../../chargeback-case/case-upload-dialog/case-upload-dialog.utils';
import { ChargebackRespondFlow } from '../chargeback-respond.flow';
import { getPreviousResponse } from '../chargeback-respond.utils';

let nextEvidenceStepId = 0;

@Component({
  selector: 'app-respond-evidence-step',
  imports: [ButtonDirective, CaseUploadDialogComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-evidence-step.component.html',
  host: { class: 'flex flex-col gap-6' },
})
export class RespondEvidenceStepComponent {
  protected readonly flow = inject(ChargebackRespondFlow);
  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND.EVIDENCE;

  private readonly id = nextEvidenceStepId++;
  protected readonly checklistId = `respond-checklist-${this.id}`;
  protected readonly noteId = `respond-note-${this.id}`;
  protected readonly noteHintId = `respond-note-hint-${this.id}`;
  protected readonly errorId = `respond-evidence-error-${this.id}`;

  protected readonly previousTitleId = `respond-previous-${this.id}`;

  protected readonly description = computed(() =>
    this.flow.mode() === 'pre-arbitration'
      ? this.copy.PRE_ARBITRATION_DESCRIPTION
      : this.copy.DESCRIPTION,
  );

  protected readonly deadline = computed(() => {
    const date = this.flow.chargeback()?.replyByDate;
    return this.flow.mode() === 'pre-arbitration' && !this.flow.incomingNote() && date
      ? CHARGEBACKS_CONSTANTS.RESPOND.REVIEW.DEADLINE(formatDate(date))
      : undefined;
  });

  protected readonly previous = computed(() => {
    const chargeback = this.flow.chargeback();
    if (this.flow.mode() !== 'pre-arbitration' || !chargeback) {
      return undefined;
    }
    const response = getPreviousResponse(chargeback);
    return (
      response && {
        ...response,
        sent: this.copy.PREVIOUS.SENT(formatDateAtTime(response.sentAt)),
        files: response.documents.map((document) => ({
          document,
          details: `${CHARGEBACK_DOCUMENT_TYPE_LABELS[document.type]} · ${formatFileSize(document.sizeBytes)}`,
          icon: isImageFile(document.name) ? 'file-image' : 'file-text',
          canOpen: document.securityStatus === 'clean',
        })),
      }
    );
  });

  protected readonly dialogOpen = signal(false);
  protected readonly uploadType = signal<ChargebackDocumentType | undefined>(undefined);

  protected readonly maxFileBytes = computed(() => getMaxFileBytes(this.flow.chargeback()?.network));
  protected readonly existingFiles = computed(() =>
    (this.flow.chargeback()?.documents ?? []).map((document) => ({
      name: document.name,
      size: document.sizeBytes,
    })),
  );

  protected readonly rows = computed(() =>
    this.flow.evidenceRows().map((row) => ({
      ...row,
      done: row.documents.length > 0,
      files: row.documents.map((document) => this.toFile(document)),
    })),
  );

  protected readonly error = computed(() => {
    if (!this.flow.attempted()) {
      return undefined;
    }
    if (this.flow.blocked()) {
      return this.copy.BLOCKED;
    }
    return this.flow.noDocuments() ? this.copy.NO_DOCUMENTS : undefined;
  });

  protected openUpload(type: ChargebackDocumentType): void {
    this.uploadType.set(type);
    this.dialogOpen.set(true);
  }

  protected onUpload(request: DocumentUploadRequest): void {
    this.flow.upload(request);
    this.dialogOpen.set(false);
  }

  protected onNote(event: Event): void {
    this.flow.note.set((event.target as HTMLTextAreaElement).value);
  }

  private toFile(document: ChargebackDocument) {
    const status = CHARGEBACK_DOCUMENT_STATUS_LABELS[document.securityStatus];
    return {
      document,
      size: formatFileSize(document.sizeBytes),
      icon: isImageFile(document.name) ? 'file-image' : 'file-text',
      status,
      scanning: document.securityStatus === 'scanning',
      failed: document.securityStatus === 'rejected' || document.securityStatus === 'upload-failed',
      canOpen: document.securityStatus === 'clean',
    };
  }
}
