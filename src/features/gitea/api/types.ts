/**
 * Gitea 저장소 — 지금은 임시 목(mock) 데이터가 이 모양을 따른다.
 * 실제 API 응답은 필드가 훨씬 많지만, 화면이 쓰는 것만 유지한다.
 */
export type GiteaRepo = {
  name: string
  /** owner/repo 형식 (예: service-engineering/hira) */
  full_name: string
  default_branch: string
  html_url: string
}

export type GiteaBranch = {
  name: string
}
