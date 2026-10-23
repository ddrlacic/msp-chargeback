import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ChargebackDocumentType } from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { formatFileSize } from '../../../../shared/utils/file.utils';
import {
  CHARGEBACK_DOCUMENT_TYPE_LABELS,
  CHARGEBACKS_CONSTANTS,
} from '../../chargebacks.constants';
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

let nextUploadId = 0;

@Component({
  selector: 'app-case-upload-dialog',
  imports: [ButtonDirective, DialogComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-upload-dialog.component.html',
})
export class CaseUploadDialogComponent {
  readonly open = input(false);
  readonly presetType = input<ChargebackDocumentType>();
  readonly existing = input<readonly UploadFileLike[]>([]);
  readonly maxFileBytes = input(UPLOAD_MAX_FILE_BYTES);
  readonly closed = output<void>();
  readonly upload = output<DocumentUploadRequest>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS.UPLOAD_DIALOG;
  protected readonly accept = UPLOAD_ACCEPT;
  protected readonly typeId = `upload-type-${nextUploadId++}`;
  protected readonly typeOptions = (
    Object.entries(CHARGEBACK_DOCUMENT_TYPE_LABELS) as [ChargebackDocumentType, string][]
  ).map(([value, label]) => ({ value, label }));

  protected readonly type = linkedSignal<ChargebackDocumentType | ''>(
    () => this.presetType() ?? '',
  );
  protected readonly files = signal<readonly File[]>([]);
  protected readonly errors = signal<readonly string[]>([]);
  protected readonly dragging = signal(false);

  protected readonly fileRows = computed(() =>
    this.files().map((file) => ({ file, size: formatFileSize(file.size) })),
  );
  protected readonly hint = computed(() => this.copy.HINT(formatFileSize(this.maxFileBytes())));
  protected readonly canSubmit = computed(() => this.type() !== '' && this.files().length > 0);
  protected readonly submitLabel = computed(() => this.copy.SUBMIT(this.files().length));

  protected onType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as ChargebackDocumentType);
  }

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
    if (type === '' || !this.files().length) {
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
    this.type.set(this.presetType() ?? '');
    this.files.set([]);
    this.errors.set([]);
    this.dragging.set(false);
  }
}
