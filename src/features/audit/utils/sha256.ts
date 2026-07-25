/** SHA-256 hex digest for audit Manifest checksums. */

export async function sha256HexFromBase64(base64: string): Promise<string> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return sha256Hex(bytes)
}

export async function sha256HexFromDataUrl(dataUrl: string): Promise<string> {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl
  return sha256HexFromBase64(base64)
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const copy = new Uint8Array(data)
  const digest = await crypto.subtle.digest('SHA-256', copy)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256HexFromText(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  return sha256Hex(encoded)
}
