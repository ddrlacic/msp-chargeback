import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { ChargebackDocument } from '../../../services/chargeback/chargeback.types';
import { createSamplePdf, getMimeType, isImageFile } from '../../../shared/utils/file.utils';
import { CHARGEBACK_DOCUMENT_TYPE_LABELS, CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';

const URL_LIFETIME_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class CaseDocumentFilesService {
  private readonly document = inject(DOCUMENT);
  private readonly files = new Map<string, Blob>();
  private readonly copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS.SAMPLE;

  store(documentId: string, file: Blob): void {
    this.files.set(documentId, file);
  }

  open(caseId: string, chargebackDocument: ChargebackDocument): void {
    const url = this.createUrl(caseId, chargebackDocument);
    this.document.defaultView?.open(url, '_blank');
  }

  private createUrl(caseId: string, chargebackDocument: ChargebackDocument): string {
    const url = URL.createObjectURL(this.getFile(caseId, chargebackDocument));
    setTimeout(() => URL.revokeObjectURL(url), URL_LIFETIME_MS);
    return url;
  }

  private getFile(caseId: string, chargebackDocument: ChargebackDocument): Blob {
    const stored = this.files.get(chargebackDocument.id);
    if (stored) {
      return stored;
    }
    const lines = [
      this.copy.TITLE,
      chargebackDocument.name,
      CHARGEBACK_DOCUMENT_TYPE_LABELS[chargebackDocument.type],
      this.copy.CASE(caseId),
      this.copy.NOTE,
    ];
    return isImageFile(chargebackDocument.name)
      ? this.createSampleImage(lines, getMimeType(chargebackDocument.name))
      : new Blob([createSamplePdf(lines)], { type: 'application/pdf' });
  }

  private createSampleImage(lines: readonly string[], type: string): Blob {
    const canvas = this.document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#f2f2f2';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#141414';
      lines.forEach((line, index) => {
        context.font = `${index === 0 ? 600 : 400} ${index === 0 ? 48 : 32}px sans-serif`;
        context.fillText(line, 80, 160 + index * 72);
      });
    }
    const [header, data] = canvas.toDataURL(type).split(',');
    const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: header.slice(5, header.indexOf(';')) });
  }
}
