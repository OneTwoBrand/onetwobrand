import sharp from 'sharp';

type RenderFitOptions = {
  width: number;
  height: number;
  quality: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  enhance?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseImageFitValue(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function renderImageFit(buffer: Buffer, options: RenderFitOptions) {
  const metadata = await sharp(buffer).rotate().metadata();
  const sourceWidth = metadata.width ?? options.width;
  const sourceHeight = metadata.height ?? options.height;
  const zoom = clamp(options.zoom ?? 1, 0.2, 2.5);
  const offsetX = clamp(options.offsetX ?? 0, -100, 100);
  const offsetY = clamp(options.offsetY ?? 0, -100, 100);

  const baseScale = Math.max(options.width / sourceWidth, options.height / sourceHeight);
  const scale = baseScale * zoom;

  if (scale < baseScale) {
    // zoom-out: imagem menor que o quadro — centralizar sobre fundo branco
    const fitWidth = Math.round(sourceWidth * scale);
    const fitHeight = Math.round(sourceHeight * scale);

    // deslocamento relativo ao espaço disponível ao redor da imagem
    const spaceX = options.width - fitWidth;
    const spaceY = options.height - fitHeight;
    const left = clamp(Math.round(spaceX / 2 + (offsetX / 100) * (spaceX / 2)), 0, spaceX);
    const top = clamp(Math.round(spaceY / 2 + (offsetY / 100) * (spaceY / 2)), 0, spaceY);

    let pipeline = sharp(buffer)
      .rotate()
      .resize(fitWidth, fitHeight, { fit: 'fill' })
      .extend({
        top,
        bottom: options.height - fitHeight - top,
        left,
        right: options.width - fitWidth - left,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });

    if (options.enhance) {
      pipeline = pipeline.modulate({ brightness: 1.03, saturation: 0.98 }).sharpen({ sigma: 0.8 });
    }

    return pipeline.webp({ quality: options.quality }).toBuffer();
  }

  // zoom >= 1: comportamento original — preenche o quadro e corta o excesso
  const resizedWidth = Math.max(options.width, Math.ceil(sourceWidth * scale));
  const resizedHeight = Math.max(options.height, Math.ceil(sourceHeight * scale));
  const maxLeft = Math.max(resizedWidth - options.width, 0);
  const maxTop = Math.max(resizedHeight - options.height, 0);
  const left = clamp(Math.round(maxLeft / 2 + (offsetX / 100) * (maxLeft / 2)), 0, maxLeft);
  const top = clamp(Math.round(maxTop / 2 + (offsetY / 100) * (maxTop / 2)), 0, maxTop);

  let pipeline = sharp(buffer)
    .rotate()
    .resize(resizedWidth, resizedHeight, { fit: 'fill' })
    .extract({ left, top, width: options.width, height: options.height });

  if (options.enhance) {
    pipeline = pipeline.modulate({ brightness: 1.03, saturation: 0.98 }).sharpen({ sigma: 0.8 });
  }

  return pipeline.webp({ quality: options.quality }).toBuffer();
}
