import { CardNetwork } from '../../../../services/chargeback/chargeback.types';
import { getFileExtension } from '../../../../shared/utils/file.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';

const MB = 1024 * 1024;

export const UPLOAD_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff'] as const;
export const UPLOAD_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.gif,.tif,.tiff,application/pdf,image/jpeg,image/png,image/gif,image/tiff';
export const UPLOAD_MAX_FILE_BYTES = 2 * MB;
export const UPLOAD_MAX_FILE_BYTES_AMEX = MB;
export const UPLOAD_MAX_CASE_BYTES = 10 * MB;
export const UPLOAD_MAX_CASE_FILES = 50;

export interface UploadFileLike {
  readonly name: string;
  readonly size: number;
}

export interface UploadSelection<T extends UploadFileLike> {
  readonly files: readonly T[];
  readonly errors: readonly string[];
}

export interface UploadLimits {
  readonly maxFileBytes: number;
  readonly existing: readonly UploadFileLike[];
}

export function getMaxFileBytes(network: CardNetwork | undefined): number {
  return network === 'amex' ? UPLOAD_MAX_FILE_BYTES_AMEX : UPLOAD_MAX_FILE_BYTES;
}

export function addUploadFiles<T extends UploadFileLike>(
  current: readonly T[],
  incoming: readonly T[],
  limits: UploadLimits = { maxFileBytes: UPLOAD_MAX_FILE_BYTES, existing: [] },
): UploadSelection<T> {
  const copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS.UPLOAD_DIALOG;
  const files = [...current];
  const errors: string[] = [];
  const names = new Set(
    [...limits.existing, ...current].map((item) => item.name.trim().toLowerCase()),
  );
  let total = [...limits.existing, ...current].reduce((sum, item) => sum + item.size, 0);
  let count = limits.existing.length + current.length;
  let tooMany = false;
  for (const file of incoming) {
    if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(getFileExtension(file.name))) {
      errors.push(copy.WRONG_TYPE(file.name));
      continue;
    }
    if (file.size > limits.maxFileBytes) {
      errors.push(copy.TOO_LARGE(file.name, limits.maxFileBytes));
      continue;
    }
    if (names.has(file.name.trim().toLowerCase())) {
      errors.push(copy.DUPLICATE(file.name));
      continue;
    }
    if (count >= UPLOAD_MAX_CASE_FILES) {
      tooMany = true;
      continue;
    }
    if (total + file.size > UPLOAD_MAX_CASE_BYTES) {
      errors.push(copy.CASE_TOO_LARGE(file.name));
      continue;
    }
    files.push(file);
    names.add(file.name.trim().toLowerCase());
    total += file.size;
    count += 1;
  }
  if (tooMany) {
    errors.push(copy.TOO_MANY);
  }
  return { files, errors };
}
