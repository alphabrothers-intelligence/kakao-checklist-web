// Draw the measured result directly. No SVG foreignObject or second HTML layout:
// mobile WebKit must not reflow parts of a long result while decoding an SVG image.
export async function renderResultCanvas(root: HTMLElement, scale = 3): Promise<HTMLCanvasElement> {
  const view = root.ownerDocument.defaultView!;
  const origin = root.getBoundingClientRect();
  const width = Math.ceil(origin.width), height = Math.ceil(root.scrollHeight);
  if (width * height * scale * scale > 16_000_000 || height * scale > 16_000) {
    throw new Error('이미지가 너무 길어 저장하지 못했어요. PDF로 저장해 주세요.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width * scale; canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('이미지를 만들지 못했어요. 다시 시도해 주세요.');
  const ctx = context;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);

  function roundedRect(x: number, y: number, w: number, h: number, style: CSSStyleDeclaration) {
    const radii = [style.borderTopLeftRadius, style.borderTopRightRadius,
      style.borderBottomRightRadius, style.borderBottomLeftRadius]
      .map(value => Math.min(parseFloat(value) || 0, w / 2, h / 2));
    const [tl, tr, br, bl] = radii;
    ctx.beginPath();
    ctx.moveTo(x + tl, y); ctx.arcTo(x + w, y, x + w, y + h, tr);
    ctx.arcTo(x + w, y + h, x, y + h, br);
    ctx.arcTo(x, y + h, x, y, bl); ctx.arcTo(x, y, x + w, y, tl);
    ctx.closePath();
  }

  function paintText(node: Text, style: CSSStyleDeclaration) {
    if (!node.textContent?.trim()) return;
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText('가Ag');
    const size = parseFloat(style.fontSize);
    const ascent = metrics.fontBoundingBoxAscent ?? size * .9;
    const descent = metrics.fontBoundingBoxDescent ?? size * .25;
    const range = node.ownerDocument.createRange();
    // Use each glyph's DOM position to retain Korean wrapping, spacing and bold.
    let offset = 0;
    for (const glyph of Array.from(node.textContent)) {
      range.setStart(node, offset); offset += glyph.length; range.setEnd(node, offset);
      if (!glyph.trim()) continue;
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const baseline = rect.top - origin.top + (rect.height - ascent - descent) / 2 + ascent;
      ctx.fillText(glyph, rect.left - origin.left, baseline);
    }
    range.detach();
  }

  function paint(element: Element) {
    const style = view.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    ctx.save();
    ctx.globalAlpha *= Number(style.opacity);
    const rect = element.getBoundingClientRect();
    const x = rect.left - origin.left, y = rect.top - origin.top;
    const boxes = style.display === 'inline' ? [...element.getClientRects()] : [rect];
    for (const box of boxes) {
      const bx = box.left - origin.left, by = box.top - origin.top;
      roundedRect(bx, by, box.width, box.height, style);
      ctx.fillStyle = style.backgroundColor; ctx.fill();
      // The result's only CSS background image is its yellow text underline.
      if (element.classList.contains('highlight') ||
          (style.backgroundImage.startsWith('linear-gradient') && element.tagName === 'STRONG')) {
        ctx.fillStyle = '#FAD524';
        ctx.fillRect(bx, by + box.height * .66, box.width, box.height * .28);
      }
    }
    const border = parseFloat(style.borderBottomWidth);
    if (border && style.borderBottomStyle !== 'none') {
      ctx.fillStyle = style.borderBottomColor;
      ctx.fillRect(x, y + rect.height - border, rect.width, border);
    }
    if (element.tagName === 'IMG') {
      ctx.drawImage(element as HTMLImageElement, x, y, rect.width, rect.height);
    } else {
      for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) paintText(child as Text, style);
        else if (child.nodeType === Node.ELEMENT_NODE) paint(child as Element);
      }
    }
    ctx.restore();
  }

  try {
    await Promise.all([...root.querySelectorAll('img')].map(image => image.decode()));
    paint(root);
    return canvas;
  } catch (error) {
    canvas.width = 0; canvas.height = 0;
    throw error;
  }
}
