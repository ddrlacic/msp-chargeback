import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  ChargebackCase,
  ChargebackDocument,
} from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { isImageFile } from '../../../../shared/utils/file.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { CaseDocumentFilesService } from '../case-document-files.service';
import { getDocumentRows } from '../chargeback-case.utils';

let nextDocumentsId = 0;

@Component({
  selector: 'app-case-documents',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-documents.component.html',
})
export class CaseDocumentsComponent {
  private readonly files = inject(CaseDocumentFilesService);

  readonly chargeback = input.required<ChargebackCase>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS;
  protected readonly titleId = `case-documents-${nextDocumentsId++}`;
  protected readonly rows = computed(() =>
    getDocumentRows(this.chargeback()).map((row) => ({
      ...row,
      icon: isImageFile(row.document.name) ? 'file-image' : 'file-text',
    })),
  );

  protected preview(document: ChargebackDocument): void {
    this.files.open(this.chargeback().caseId, document);
  }

  protected download(document: ChargebackDocument): void {
    this.files.download(this.chargeback().caseId, document);
  }
}
