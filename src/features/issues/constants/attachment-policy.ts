/** 첨부파일 정책 — 스펙 §4.2 */
export const ATTACHMENT_POLICY = {
  maxFileSize: 50 * 1024 * 1024,
  maxTotalSize: 200 * 1024 * 1024,
  allowedExtensions: [
    'pdf',
    'docx',
    'xlsx',
    'pptx',
    'hwp',
    'hwpx',
    'txt',
    'csv',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'zip',
  ],
} as const

export function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/** 화이트리스트·용량 검증. 통과하면 null, 아니면 사용자에게 보여줄 사유를 돌려준다. */
export function validateAttachment(file: File, currentTotalSize: number): string | null {
  const extension = getFileExtension(file.name)

  if (!ATTACHMENT_POLICY.allowedExtensions.includes(extension as never)) {
    return `${file.name} — 업로드할 수 없는 확장자입니다`
  }
  if (file.size > ATTACHMENT_POLICY.maxFileSize) {
    return `${file.name} — 파일당 최대 50MB까지 첨부할 수 있어요`
  }
  if (currentTotalSize + file.size > ATTACHMENT_POLICY.maxTotalSize) {
    return `${file.name} — 이슈당 총 200MB를 초과했어요`
  }
  return null
}
