import {
  addUploadFiles,
  getMaxFileBytes,
  UPLOAD_MAX_CASE_BYTES,
  UPLOAD_MAX_CASE_FILES,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_MAX_FILE_BYTES_AMEX,
} from './case-upload-dialog.utils';

const file = (name: string, size = 1000) => ({ name, size });

const limits = (existing: readonly { name: string; size: number }[] = []) => ({
  maxFileBytes: UPLOAD_MAX_FILE_BYTES,
  existing,
});

describe('addUploadFiles', () => {
  it('adds PDF, JPG, PNG, GIF and TIF files', () => {
    const incoming = [
      file('a.pdf'),
      file('b.JPG'),
      file('c.png'),
      file('d.jpeg'),
      file('e.gif'),
      file('f.tif'),
      file('g.TIFF'),
    ];

    expect(addUploadFiles([], incoming, limits())).toEqual({ files: incoming, errors: [] });
  });

  it('rejects other file types', () => {
    expect(addUploadFiles([], [file('notes.docx')], limits())).toEqual({
      files: [],
      errors: ['Couldn’t add notes.docx. Use a PDF, JPG, PNG, GIF, or TIF file.'],
    });
  });

  it('rejects a file with the same name as one already picked', () => {
    const current = [file('a.pdf')];

    expect(addUploadFiles(current, [file('A.pdf', 50)], limits())).toEqual({
      files: current,
      errors: ['Couldn’t add A.pdf. This case already has a document with that name.'],
    });
  });

  it('rejects a file with the same name as one already on the case', () => {
    const result = addUploadFiles([], [file('receipt.pdf')], limits([file('receipt.pdf')]));

    expect(result.files).toEqual([]);
    expect(result.errors).toEqual([
      'Couldn’t add receipt.pdf. This case already has a document with that name.',
    ]);
  });

  it('keeps each file within 2 MB', () => {
    const result = addUploadFiles(
      [],
      [file('big.pdf', UPLOAD_MAX_FILE_BYTES + 1), file('ok.pdf', UPLOAD_MAX_FILE_BYTES)],
      limits(),
    );

    expect(result.files.map((item) => item.name)).toEqual(['ok.pdf']);
    expect(result.errors).toEqual(['Couldn’t add big.pdf. Each file can be up to 2 MB.']);
  });

  it('keeps each file within 1 MB for American Express', () => {
    const result = addUploadFiles([], [file('photo.jpg', UPLOAD_MAX_FILE_BYTES_AMEX + 1)], {
      maxFileBytes: getMaxFileBytes('amex'),
      existing: [],
    });

    expect(result.files).toEqual([]);
    expect(result.errors).toEqual(['Couldn’t add photo.jpg. Each file can be up to 1 MB.']);
  });

  it('keeps the case within 50 documents', () => {
    const existing = Array.from({ length: UPLOAD_MAX_CASE_FILES - 1 }, (_, index) =>
      file(`existing-${index}.pdf`),
    );
    const result = addUploadFiles([], [file('a.pdf'), file('b.pdf')], limits(existing));

    expect(result.files.map((item) => item.name)).toEqual(['a.pdf']);
    expect(result.errors).toEqual(['A case can have up to 50 documents']);
  });

  it('keeps the case within 10 MB including documents already on it', () => {
    const result = addUploadFiles(
      [file('picked.pdf', UPLOAD_MAX_FILE_BYTES)],
      [file('small.png', 10), file('extra.pdf', UPLOAD_MAX_FILE_BYTES)],
      limits([
        file('one.pdf', UPLOAD_MAX_FILE_BYTES),
        file('two.pdf', UPLOAD_MAX_FILE_BYTES),
        file('three.pdf', UPLOAD_MAX_FILE_BYTES),
        file('four.pdf', UPLOAD_MAX_CASE_BYTES - UPLOAD_MAX_FILE_BYTES * 4 - 10),
      ]),
    );

    expect(result.files.map((item) => item.name)).toEqual(['picked.pdf', 'small.png']);
    expect(result.errors).toEqual([
      'Couldn’t add extra.pdf. A case can have up to 10 MB of documents.',
    ]);
  });
});

describe('getMaxFileBytes', () => {
  it('allows 1 MB for American Express and 2 MB for other networks', () => {
    expect(getMaxFileBytes('amex')).toBe(UPLOAD_MAX_FILE_BYTES_AMEX);
    expect(getMaxFileBytes('visa')).toBe(UPLOAD_MAX_FILE_BYTES);
    expect(getMaxFileBytes(undefined)).toBe(UPLOAD_MAX_FILE_BYTES);
  });
});
