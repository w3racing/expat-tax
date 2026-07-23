/** Resize + JPEG-compress phone photos/screenshots for durable local storage. */

export const MAX_LOCAL_IMAGE_BYTES = 400 * 1024
export const MAX_LOCAL_IMAGE_SOURCE_BYTES = 12 * 1024 * 1024
const IMAGE_MAX_EDGE = 1280
const JPEG_QUALITY_START = 0.72
const JPEG_QUALITY_FLOOR = 0.4

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

function jpegFileName(fileName: string): string {
  const base = (fileName || 'image').replace(/\.[^.]+$/, '')
  return `${base || 'image'}.jpg`
}

function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = mimeType || header?.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], fileName, { type: mime })
}

/**
 * Compress an image File for local vault storage.
 * Non-images are returned unchanged. HEIC and other decode failures reject.
 */
export async function prepareLocalEvidenceFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size > MAX_LOCAL_IMAGE_SOURCE_BYTES) {
    throw Object.assign(new Error('Photo is too large (max about 12 MB)'), {
      code: 'UPLOAD_FAILED',
    })
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw Object.assign(new Error('Could not read that image. Try a JPG or PNG.'), {
      code: 'UPLOAD_FAILED',
    })
  }

  try {
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw Object.assign(new Error('Could not process that photo'), { code: 'UPLOAD_FAILED' })
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    let quality = JPEG_QUALITY_START
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrlByteLength(dataUrl) > MAX_LOCAL_IMAGE_BYTES && quality > JPEG_QUALITY_FLOOR) {
      quality = Math.max(JPEG_QUALITY_FLOOR, quality - 0.1)
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (dataUrlByteLength(dataUrl) > MAX_LOCAL_IMAGE_BYTES) {
      throw Object.assign(
        new Error('Photo is still too large after compressing. Try another image.'),
        { code: 'UPLOAD_FAILED' },
      )
    }

    return dataUrlToFile(dataUrl, jpegFileName(file.name), 'image/jpeg')
  } finally {
    bitmap.close()
  }
}
