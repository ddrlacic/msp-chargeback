import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ChargebackDocumentType } from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { formatFileSize } from '../../../../shared/utils/file.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import {
  addUploadFiles,
  UPLOAD_ACCEPT,
  UPLOAD_MAX_FILE_BYTES,
  UploadFileLike,
} from './case-upload-dialog.utils';

export interface DocumentUploadRequest {
  readonly type: ChargebackDocumentType;
  readonly files: readonly File[];
}

@Component({
  selector: 'app-case-upload-dialog',
  imports: [ButtonDirective, DialogComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-upload-dialog.component.html',
})
export class CaseUploadDialogComponent {
  readonly open = input(false);
  readonly type = input<ChargebackDocumentType>();
  readonly title = input.required<string>();
  readonly existing = input<readonly UploadFileLike[]>([]);
  readonly maxFileBytes = input(UPLOAD_MAX_FILE_BYTES);
  readonly closed = output<void>();
  readonly upload = output<DocumentUploadRequest>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS.UPLOAD_DIALOG;
  protected readonly accept = UPLOAD_ACCEPT;
  protected readonly files = signal<readonly File[]>([]);
  protected readonly errors = signal<readonly string[]>([]);
  protected readonly dragging = signal(false);

  protected readonly fileRows = computed(() =>
    this.files().map((file) => ({ file, size: formatFileSize(file.size) })),
  );
  protected readonly hint = computed(() => this.copy.HINT(formatFileSize(this.maxFileBytes())));
  protected readonly canSubmit = computed(
    () => this.type() !== undefined && this.files().length > 0,
  );
  protected readonly submitLabel = computed(() => this.copy.SUBMIT(this.files().length));

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const zone = event.currentTarget as HTMLElement;
    if (!(event.relatedTarget instanceof Node) || !zone.contains(event.relatedTarget)) {
      this.dragging.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  protected removeFile(file: File): void {
    this.files.update((files) => files.filter((item) => item !== file));
    this.errors.set([]);
  }

  protected submit(): void {
    const type = this.type();
    if (type === undefined || !this.files().length) {
      return;
    }
    this.upload.emit({ type, files: this.files() });
    this.reset();
  }

  protected close(): void {
    this.reset();
    this.closed.emit();
  }

  private addFiles(incoming: readonly File[]): void {
    const selection = addUploadFiles(this.files(), incoming, {
      maxFileBytes: this.maxFileBytes(),
      existing: this.existing(),
    });
    this.files.set(selection.files);
    this.errors.set(selection.errors);
  }

  private reset(): void {
    this.files.set([]);
    this.errors.set([]);
    this.dragging.set(false);
  }
}
