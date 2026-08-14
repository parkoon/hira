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
  // 점이 없거나 숨김 파일(.env)처럼 이름 전체가 점 뒤인 경우는 확장자 없음으로 본다 —
  // split().pop()은 이름이 'pdf'인 무확장자 파일을 통과시킨다
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex <= 0) return ''
  return fileName.slice(dotIndex + 1).toLowerCase()
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
    return `${file.name} — 작업당 총 200MB를 초과했어요`
  }
  return null
}
