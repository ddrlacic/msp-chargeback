import { getFileExtension } from '../../../../shared/utils/file.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';

export const UPLOAD_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const;
export const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
export const UPLOAD_MAX_FILES = 5;
export const UPLOAD_MAX_TOTAL_BYTES = 30 * 1024 * 1024;

export interface UploadFileLike {
  readonly name: string;
  readonly size: number;
}

export interface UploadSelection<T extends UploadFileLike> {
  readonly files: readonly T[];
  readonly errors: readonly string[];
}

export function addUploadFiles<T extends UploadFileLike>(
  current: readonly T[],
  incoming: readonly T[],
): UploadSelection<T> {
  const copy = CHARGEBACKS_CONSTANTS.CASE.DOCUMENTS.UPLOAD_DIALOG;
  const files = [...current];
  const errors: string[] = [];
  let total = current.reduce((sum, file) => sum + file.size, 0);
  let tooMany = false;
  for (const file of incoming) {
    if (files.some((item) => item.name === file.name && item.size === file.size)) {
      continue;
    }
    if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(getFileExtension(file.name))) {
      errors.push(copy.WRONG_TYPE(file.name));
      continue;
    }
    if (files.length >= UPLOAD_MAX_FILES) {
      tooMany = true;
      continue;
    }
    if (total + file.size > UPLOAD_MAX_TOTAL_BYTES) {
      errors.push(copy.TOO_LARGE(file.name));
      continue;
    }
    files.push(file);
    total += file.size;
  }
  if (tooMany) {
    errors.push(copy.TOO_MANY);
  }
  return { files, errors };
}
