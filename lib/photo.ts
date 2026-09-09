export type PhotoDraft = {
  url: string
  width: number
  height: number
}

export function readPhotoFile(file: File): Promise<PhotoDraft> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('image'))
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      if (!image.width || !image.height) {
        URL.revokeObjectURL(url)
        reject(new Error('image'))
        return
      }
      resolve({ url, width: image.width, height: image.height })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    image.src = url
  })
}

export function coverScale(width: number, height: number, frameW: number, frameH = frameW) {
  return Math.max(frameW / width, frameH / height)
}

export function clampPan(
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  frameW: number,
  frameH = frameW,
) {
  const dw = width * scale
  const dh = height * scale
  return {
    x: Math.min(0, Math.max(frameW - dw, x)),
    y: Math.min(0, Math.max(frameH - dh, y)),
  }
}

export function centeredCrop(width: number, height: number, frameW: number, frameH = frameW) {
  const scale = coverScale(width, height, frameW, frameH)
  return {
    scale,
    ...clampPan((frameW - width * scale) / 2, (frameH - height * scale) / 2, width, height, scale, frameW, frameH),
  }
}

export function exportCrop(
  image: HTMLImageElement,
  crop: { x: number; y: number; scale: number; width: number; height: number },
  output?: { width: number; height: number },
) {
  const outW = Math.round(output?.width ?? crop.width)
  const outH = Math.round(output?.height ?? crop.height)
  const sourceW = crop.width / crop.scale
  const sourceH = crop.height / crop.scale
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(image, -crop.x / crop.scale, -crop.y / crop.scale, sourceW, sourceH, 0, 0, outW, outH)
  return canvas.toDataURL('image/jpeg', 0.86)
}
