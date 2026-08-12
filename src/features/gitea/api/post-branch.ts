import { useMutation } from '@tanstack/react-query'

import type { GiteaBranch } from '@/features/gitea/api/types'

export type PostBranchBody = {
  /** owner/repo 형식 */
  repoFullName: string
  branchName: string
}

/**
 * 임시 목(mock) — 실제 Gitea에 브랜치를 만들지 않는다.
 * 2차 백엔드 중계가 생기면 이 service 본문만 실제 호출로 교체한다.
 */
export const postBranchService = async ({ branchName }: PostBranchBody): Promise<GiteaBranch> => {
  // 실제 네트워크 왕복처럼 보이게 잠깐 지연한다
  await new Promise((resolve) => setTimeout(resolve, 400))
  return { name: branchName }
}

export const getPostBranchMutationKey = () => ['/gitea/repos/{repo}/branches', 'post'] as const

export function usePostBranchMutation() {
  return useMutation({
    mutationKey: getPostBranchMutationKey(),
    mutationFn: postBranchService,
  })
}
