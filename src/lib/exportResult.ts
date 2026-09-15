export type ExportFormat = 'png' | 'pdf';
export interface ExportedFile { blob: Blob; filename: string; width: number; height: number }

export async function exportResult(element: HTMLElement, format: ExportFormat): Promise<ExportedFile> {
  const { renderResultCanvas } = await import('./renderResultCanvas');
  await document.fonts.ready;
  // Capture the settled character position even when downloading during its entrance.
  element.getAnimations({ subtree: true }).forEach(animation => {
    if (Number.isFinite(animation.effect?.getComputedTiming().endTime)) animation.finish();
  });
  await Promise.all([...element.querySelectorAll('img')].map(image => image.decode()));
  // Render in an isolated viewport: PNG always uses mobile layout, PDF desktop layout.
  const frame = document.createElement('iframe');
  frame.title = '결과 저장용 화면'; frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
  const viewportWidth = format === 'png' ? 390 : 1080;
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${viewportWidth}px;height:1000px;border:0;pointer-events:none;`;
  document.body.append(frame);
  const scale = format === 'png' ? 3 : 2;
  let canvas: HTMLCanvasElement;
  let width: number;
  let height: number;
  try {
    const doc = frame.contentDocument!;
    const viewport = doc.createElement('meta'); viewport.name = 'viewport';
    viewport.content = `width=${viewportWidth}, initial-scale=1`; doc.head.append(viewport);
    const base = doc.createElement('base'); base.href = document.baseURI; doc.head.append(base);
    const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')];
    await Promise.all(styles.map(source => new Promise<void>((resolve, reject) => {
      const copy = source.cloneNode(true) as HTMLElement;
      if (copy.tagName === 'LINK') {
        copy.onload = () => resolve(); copy.onerror = () => reject(new Error('저장 화면 스타일을 불러오지 못했어요.'));
      }
      doc.head.append(copy);
      if (copy.tagName !== 'LINK') resolve();
    })));
    const freeze = doc.createElement('style');
    freeze.textContent = 'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}*{animation:none!important;transition:none!important}'; doc.head.append(freeze);
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-export-ignore]').forEach(node => node.remove());
    doc.body.append(copy);
    // Start font loading explicitly before measuring the offscreen result.
    await Promise.all([
      doc.fonts.load('400 16px Big'),
      doc.fonts.load('700 32px Big'),
    ]);
    await doc.fonts.ready;
    await Promise.all([...copy.querySelectorAll('img')].map(image => image.decode()));
    width = Math.ceil(copy.getBoundingClientRect().width);
    height = Math.ceil(copy.scrollHeight);
    canvas = await renderResultCanvas(copy, scale);
  } finally { frame.remove(); }
  if (canvas.width !== width * scale || canvas.height !== height * scale) throw new Error('고해상도 저장에 실패했어요. 기본 브라우저에서 다시 시도해 주세요.');
  const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 생성에 실패했어요. 다시 시도해 주세요.')), 'image/png'));
  let blob = png;
  if (format === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    const image = await pdf.embedPng(await png.arrayBuffer());
    const pageWidth = 595.28, pageHeight = pageWidth * canvas.height / canvas.width;
    if (pageHeight > 14400) throw new Error('결과가 너무 길어요. 이미지로 저장해 주세요.');
    pdf.addPage([pageWidth, pageHeight]).drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
    pdf.setTitle('카카오 광고 자가 진단 체크리스트'); pdf.setCreator('우리 사업 광고 자가진단');
    blob = new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
  }
  const result = { blob, filename: `카카오 광고 자가 진단 체크리스트.${format}`, width: canvas.width, height: canvas.height };
  canvas.width = 0; canvas.height = 0;
  return result;
}
