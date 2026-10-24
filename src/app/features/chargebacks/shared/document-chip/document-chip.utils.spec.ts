import {
  ChargebackDocument,
  ChargebackDocumentSecurityStatus,
} from '../../../../services/chargeback/chargeback.types';
import { getDocumentChipState } from './document-chip.utils';

function createDocument(
  name: string,
  securityStatus: ChargebackDocumentSecurityStatus,
): ChargebackDocument {
  return {
    id: 'doc-1',
    name,
    type: 'transaction-receipt',
    sizeBytes: 2048,
    securityStatus,
    uploadedBy: 'Alex Morgan',
    createdDateTime: '2026-10-20T10:00:00.000Z',
  };
}

describe('getDocumentChipState', () => {
  it('opens clean documents and shows no status', () => {
    expect(getDocumentChipState(createDocument('receipt.pdf', 'clean'))).toEqual({
      icon: 'file-text',
      canOpen: true,
      scanning: false,
      failed: false,
      status: undefined,
    });
  });

  it('uses the image icon for photos', () => {
    expect(getDocumentChipState(createDocument('delivery-photo.jpg', 'clean')).icon).toBe(
      'file-image',
    );
  });

  it('blocks opening while the security scan runs', () => {
    expect(getDocumentChipState(createDocument('receipt.pdf', 'scanning'))).toEqual({
      icon: 'file-text',
      canOpen: false,
      scanning: true,
      failed: false,
      status: 'Scanning',
    });
  });

  it('marks blocked and failed uploads as failed', () => {
    expect(getDocumentChipState(createDocument('receipt.pdf', 'rejected'))).toEqual({
      icon: 'file-text',
      canOpen: false,
      scanning: false,
      failed: true,
      status: 'Blocked by the security scan',
    });
    expect(getDocumentChipState(createDocument('receipt.pdf', 'upload-failed')).status).toBe(
      'Upload failed',
    );
  });
});
