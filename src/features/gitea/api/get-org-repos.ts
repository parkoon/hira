import { queryOptions } from '@tanstack/react-query'

import type { GiteaRepo } from '@/features/gitea/api/types'

/**
 * 임시 목(mock) — 폐쇄망 Gitea에는 클라우드(배포 데모)에서 닿을 수 없어 직접 호출하지 않는다.
 * 2차 백엔드 중계가 생기면 이 service 본문만 실제 호출로 교체한다.
 */
const GITEA_HOST = 'https://git.example.com'
const GITEA_ORG = 'example-org'

const MOCK_REPOS: GiteaRepo[] = [
  'hira:main',
  'billing-frontend:develop',
  'billing-backend:develop',
  'contract-frontend:main',
  'contract-backend:develop',
  'claims-frontend:develop',
  'claims-backend:develop',
  'common-auth:develop',
  'common-commons:develop',
  'common-stamp:develop',
].map((entry) => {
  const [name, defaultBranch] = entry.split(':')
  return {
    name,
    full_name: `${GITEA_ORG}/${name}`,
    default_branch: defaultBranch,
    html_url: `${GITEA_HOST}/${GITEA_ORG}/${name}`,
  }
})

export const getOrgReposService = async (): Promise<GiteaRepo[]> => {
  // 실제 네트워크 왕복처럼 보이게 잠깐 지연한다
  await new Promise((resolve) => setTimeout(resolve, 400))
  return MOCK_REPOS
}

export const getOrgReposQueryKey = () => ['/gitea/orgs/{org}/repos'] as const

export const getOrgReposQueryOptions = () =>
  queryOptions({
    queryKey: getOrgReposQueryKey(),
    queryFn: getOrgReposService,
  })
