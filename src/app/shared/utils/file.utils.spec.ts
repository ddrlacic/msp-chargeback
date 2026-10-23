import {
  createSamplePdf,
  formatFileSize,
  getFileExtension,
  getMimeType,
  isImageFile,
} from './file.utils';

describe('file utils', () => {
  it('formats file sizes with a space before the unit', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(184_320)).toBe('180 KB');
    expect(formatFileSize(1_204_224)).toBe('1.1 MB');
  });

  it('reads the extension in lowercase', () => {
    expect(getFileExtension('Photo.JPG')).toBe('jpg');
    expect(getFileExtension('notes')).toBe('');
  });

  it('knows which files are images', () => {
    expect(isImageFile('delivery-photo.jpg')).toBe(true);
    expect(isImageFile('scan.TIF')).toBe(true);
    expect(isImageFile('stamp.gif')).toBe(true);
    expect(isImageFile('receipt.pdf')).toBe(false);
  });

  it('maps extensions to MIME types', () => {
    expect(getMimeType('receipt.pdf')).toBe('application/pdf');
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(getMimeType('photo.png')).toBe('image/png');
    expect(getMimeType('stamp.gif')).toBe('image/gif');
    expect(getMimeType('scan.tif')).toBe('image/tiff');
    expect(getMimeType('scan.tiff')).toBe('image/tiff');
  });

  it('builds a PDF whose cross-reference table points at each object', () => {
    const pdf = createSamplePdf(['Sample (copy)', 'Case CB-1']);
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]));
    const startXref = Number(pdf.match(/startxref\n(\d+)/)?.[1]);

    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('(Sample \\(copy\\)) Tj');
    expect(offsets.map((offset) => pdf.slice(offset, pdf.indexOf('\n', offset)))).toEqual([
      '1 0 obj',
      '2 0 obj',
      '3 0 obj',
      '4 0 obj',
      '5 0 obj',
    ]);
    expect(pdf.slice(startXref, startXref + 4)).toBe('xref');
  });
});
