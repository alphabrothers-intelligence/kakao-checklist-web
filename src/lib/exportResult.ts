export type ExportFormat = 'png' | 'pdf';
export interface ExportedFile { blob: Blob; filename: string; width: number; height: number }

async function embeddedFontCSS() {
  const fonts = [
    { name: 'Big', weight: 700, url: '/fonts/KakaoBigSans-Bold.woff2' },
    { name: 'Big', weight: 400, url: '/fonts/KakaoBigSans-Regular.woff2' },
  ];
  return (await Promise.all(fonts.map(async ({ name, weight, url }) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('폰트를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject;
      response.blob().then(blob => reader.readAsDataURL(blob), reject);
    });
    return `@font-face{font-family:${name};font-weight:${weight};src:url(${dataURL}) format('woff2');}`;
  }))).join('\n');
}
let fontCSSPromise: Promise<string> | undefined;
export async function exportResult(element: HTMLElement, format: ExportFormat): Promise<ExportedFile> {
  const { toCanvas } = await import('html-to-image');
  await document.fonts.ready;
  // Capture the settled character position even when downloading during its entrance.
  element.getAnimations({ subtree: true }).forEach(animation => {
    if (Number.isFinite(animation.effect?.getComputedTiming().endTime)) animation.finish();
  });
  await Promise.all([...element.querySelectorAll('img')].map(image => image.decode()));
  fontCSSPromise ??= embeddedFontCSS().catch(error => { fontCSSPromise = undefined; throw error; });
  const fontEmbedCSS = await fontCSSPromise;
  // Render in an isolated viewport: PNG always uses mobile layout, PDF desktop layout.
  const frame = document.createElement('iframe');
  frame.title = '결과 저장용 화면'; frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
  const viewportWidth = format === 'png' ? 390 : 1080;
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${viewportWidth}px;height:1000px;border:0;pointer-events:none;`;
  document.body.append(frame);
  let canvas: HTMLCanvasElement;
  let width: number;
  let height: number;
  try {
    const doc = frame.contentDocument!;
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
    freeze.textContent = '*{animation:none!important;transition:none!important}'; doc.head.append(freeze);
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-export-ignore]').forEach(node => node.remove());
    doc.body.append(copy);
    await doc.fonts.ready;
    await Promise.all([...copy.querySelectorAll('img')].map(image => image.decode()));
    width = Math.ceil(copy.getBoundingClientRect().width);
    height = Math.ceil(copy.scrollHeight);
    if (height * 3 > 30000 || width * height * 9 > 100_000_000) throw new Error('결과가 너무 커서 저장하지 못했어요.');
    canvas = await toCanvas(copy, {
      backgroundColor: '#fff', pixelRatio: 3, skipAutoScale: true, width, height, fontEmbedCSS,
      style: { margin: '0', boxSizing: 'border-box' },
    });
  } finally { frame.remove(); }
  if (canvas.width < width * 2.9 || canvas.height < height * 2.9) throw new Error('고해상도 저장에 실패했어요. 기본 브라우저에서 다시 시도해 주세요.');
  const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 생성에 실패했어요. 다시 시도해 주세요.')), 'image/png'));
  let blob = png;
  if (format === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    const image = await pdf.embedPng(await png.arrayBuffer());
    const pageWidth = 595.28, pageHeight = pageWidth * canvas.height / canvas.width;
    if (pageHeight > 14400) throw new Error('결과가 너무 길어요. 이미지로 저장해 주세요.');
    pdf.addPage([pageWidth, pageHeight]).drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
    pdf.setTitle('우리 사업 광고 진단 결과'); pdf.setCreator('우리 사업 광고 자가진단');
    blob = new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
  }
  const result = { blob, filename: `우리_사업_광고_진단결과.${format}`, width: canvas.width, height: canvas.height };
  canvas.width = 0; canvas.height = 0;
  return result;
}
