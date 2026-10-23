import { addUploadFiles, UPLOAD_MAX_TOTAL_BYTES } from './case-upload-dialog.utils';

const file = (name: string, size = 1000) => ({ name, size });

describe('addUploadFiles', () => {
  it('adds PDF, JPG and PNG files', () => {
    const incoming = [file('a.pdf'), file('b.JPG'), file('c.png'), file('d.jpeg')];

    expect(addUploadFiles([], incoming)).toEqual({ files: incoming, errors: [] });
  });

  it('rejects other file types', () => {
    expect(addUploadFiles([], [file('notes.docx')])).toEqual({
      files: [],
      errors: ['Couldn’t add notes.docx. Use a PDF, JPG, or PNG file.'],
    });
  });

  it('skips a file that is already in the list', () => {
    const current = [file('a.pdf')];

    expect(addUploadFiles(current, [file('a.pdf')]).files).toEqual(current);
  });

  it('keeps at most 5 files', () => {
    const current = [file('1.pdf'), file('2.pdf'), file('3.pdf'), file('4.pdf')];
    const result = addUploadFiles(current, [file('5.pdf'), file('6.pdf'), file('7.pdf')]);

    expect(result.files.map((item) => item.name)).toEqual([
      '1.pdf',
      '2.pdf',
      '3.pdf',
      '4.pdf',
      '5.pdf',
    ]);
    expect(result.errors).toEqual(['You can upload up to 5 files at a time']);
  });

  it('keeps the total size within 30 MB', () => {
    const result = addUploadFiles(
      [file('big.pdf', UPLOAD_MAX_TOTAL_BYTES - 10)],
      [file('small.png', 10), file('extra.pdf', 1)],
    );

    expect(result.files.map((item) => item.name)).toEqual(['big.pdf', 'small.png']);
    expect(result.errors).toEqual(['Couldn’t add extra.pdf. Files can be up to 30 MB in total.']);
  });
});
