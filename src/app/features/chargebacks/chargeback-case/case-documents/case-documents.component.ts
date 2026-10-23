import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ChargebackStore } from '../../../../services/chargeback/chargeback.store';
import {
  ChargebackCase,
  ChargebackDocument,
} from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { isImageFile } from '../../../../shared/utils/file.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { CaseDocumentFilesService } from '../case-document-files.service';
import {
  CaseUploadDialogComponent,
  DocumentUploadRequest,
} from '../case-upload-dialog/case-upload-dialog.component';
import { canUploadDocuments, getDocumentRows } from '../chargeback-case.utils';

let nextDocumentsId = 0;

@Component({
  selector: 'app-case-documents',
  imports: [ButtonDirective, CaseUploadDialogComponent, DialogComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-documents.component.html',
})
export class CaseDocumentsComponent {
  private readonly store = inject(ChargebackStore);
  private readonly files = inject(CaseDocumentFilesService);

  readonly chargeback = input.required<ChargebackCase>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS;
  protected readonly titleId = `case-documents-${nextDocumentsId++}`;
  protected readonly rows = computed(() =>
    getDocumentRows(this.chargeback()).map((row) => ({
      ...row,
      icon: isImageFile(row.document.name) ? 'file-image' : 'file-text',
    })),
  );
  protected readonly canUpload = computed(() => canUploadDocuments(this.chargeback()));

  protected readonly uploadOpen = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly pendingDelete = signal<ChargebackDocument | undefined>(undefined);
  protected readonly deleteMessage = computed(() =>
    this.copy.DELETE_DIALOG.MESSAGE(this.pendingDelete()?.name ?? ''),
  );
  protected readonly announcement = signal('');

  protected preview(document: ChargebackDocument): void {
    this.files.open(this.chargeback().caseId, document);
  }

  protected download(document: ChargebackDocument): void {
    this.files.download(this.chargeback().caseId, document);
  }

  protected upload(request: DocumentUploadRequest): void {
    const ids = this.store.uploadDocuments(
      this.chargeback().caseId,
      request.type,
      request.files.map((file) => ({ name: file.name, sizeBytes: file.size })),
    );
    ids.forEach((id, index) => this.files.store(id, request.files[index]));
    this.uploadOpen.set(false);
    this.announcement.set(this.copy.UPLOADED_ANNOUNCEMENT(ids.length));
  }

  protected askDelete(document: ChargebackDocument): void {
    this.pendingDelete.set(document);
    this.deleteOpen.set(true);
  }

  protected confirmDelete(): void {
    const document = this.pendingDelete();
    this.deleteOpen.set(false);
    if (!document) {
      return;
    }
    this.store.deleteDocument(this.chargeback().caseId, document.id);
    this.announcement.set(this.copy.DELETED_ANNOUNCEMENT);
    this.heading().nativeElement.focus();
  }
}
