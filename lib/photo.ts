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

export function coverScale(width: number, height: number, crop: number) {
  return crop / Math.min(width, height)
}

export function clampPan(x: number, y: number, width: number, height: number, scale: number, crop: number) {
  const dw = width * scale
  const dh = height * scale
  return {
    x: Math.min(0, Math.max(crop - dw, x)),
    y: Math.min(0, Math.max(crop - dh, y)),
  }
}

export function centeredCrop(width: number, height: number, crop: number) {
  const scale = coverScale(width, height, crop)
  return {
    scale,
    ...clampPan((crop - width * scale) / 2, (crop - height * scale) / 2, width, height, scale, crop),
  }
}

export function exportCrop(
  image: HTMLImageElement,
  crop: { x: number; y: number; scale: number; size: number },
  output = 512,
) {
  const source = crop.size / crop.scale
  const canvas = document.createElement('canvas')
  canvas.width = output
  canvas.height = output
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(image, -crop.x / crop.scale, -crop.y / crop.scale, source, source, 0, 0, output, output)
  return canvas.toDataURL('image/jpeg', 0.86)
}
