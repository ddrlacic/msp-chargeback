import { ChargebackDocument } from '../../../../services/chargeback/chargeback.types';
import { isImageFile } from '../../../../shared/utils/file.utils';
import { CHARGEBACK_DOCUMENT_STATUS_LABELS } from '../../chargebacks.constants';

export interface DocumentChipState {
  readonly icon: 'file-image' | 'file-text';
  readonly canOpen: boolean;
  readonly scanning: boolean;
  readonly failed: boolean;
  readonly status?: string;
}

export function getDocumentChipState(document: ChargebackDocument): DocumentChipState {
  const { securityStatus } = document;
  return {
    icon: isImageFile(document.name) ? 'file-image' : 'file-text',
    canOpen: securityStatus === 'clean',
    scanning: securityStatus === 'scanning',
    failed: securityStatus === 'rejected' || securityStatus === 'upload-failed',
    status: CHARGEBACK_DOCUMENT_STATUS_LABELS[securityStatus],
  };
}
