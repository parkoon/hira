import { useQuery } from '@tanstack/react-query'
import { GitBranchIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { getOrgReposQueryOptions } from '@/features/gitea/api/get-org-repos'
import { usePostBranchMutation } from '@/features/gitea/api/post-branch'
import { useRecordSubtaskBranchMutation } from '@/features/tasks/api/record-subtask-branch'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

type CreateBranchDialogProps = {
  /** 브랜치명에 들어갈 하위작업 번호 (예: WR-2026-0001-01) */
  subtaskNo: string
}

/**
 * 저장소를 골라 하위작업 번호가 들어간 브랜치를 만들고 하위작업에 기록한다.
 * Gitea 호출은 임시 목(mock)이다 — 실제 생성은 2차 백엔드 중계가 생기면 붙는다.
 */
export function CreateBranchDialog({ subtaskNo }: CreateBranchDialogProps) {
  const { user } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [repoFullName, setRepoFullName] = useState('')
  const [branchName, setBranchName] = useState('')

  const reposQuery = useQuery({ ...getOrgReposQueryOptions(), enabled: open })
  const createBranch = usePostBranchMutation()
  const recordBranch = useRecordSubtaskBranchMutation()

  const selectedRepo = reposQuery.data?.find((repo) => repo.full_name === repoFullName)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setBranchName(`feature/${subtaskNo}`)
      setRepoFullName('')
    }
    setOpen(nextOpen)
  }

  const handleCreate = () => {
    if (!selectedRepo) return
    createBranch.mutate(
      { repoFullName, branchName: branchName.trim() },
      {
        onSuccess: (created) => {
          // 브랜치명의 '/'는 인코딩하지 않는다 — Gitea URL 관례이고, %2F는 nginx가 거부할 수 있다
          const branchUrl = `${selectedRepo.html_url}/src/branch/${created.name}`
          // 기록 실패는 전역 토스트가 알린다
          recordBranch.mutate({
            subtaskNo,
            repoFullName,
            branchName: created.name,
            branchUrl,
            actorName: user.name,
          })
          toast.success('브랜치를 생성했습니다', {
            description: branchUrl,
            action: {
              label: '열기',
              onClick: () => window.open(branchUrl, '_blank', 'noreferrer'),
            },
          })
          setOpen(false)
        },
      }
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-2 px-2 font-normal"
        >
          <GitBranchIcon />
          브랜치 생성
        </Button>
      }
      title={`${subtaskNo} 브랜치 생성`}
      description="선택한 저장소의 기본 브랜치에서 새 브랜치를 만듭니다. 지금은 시연용이라 실제 Gitea에는 생성되지 않습니다."
      className="h-auto max-h-[calc(100dvh-2rem)] sm:max-w-lg"
      expandable={false}
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{
        label: createBranch.isPending ? '생성 중…' : '브랜치 생성',
        disabled:
          createBranch.isPending || repoFullName.length === 0 || branchName.trim().length === 0,
        onClick: handleCreate,
      }}
    >
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="branch-repo">저장소</FieldLabel>
          <Select
            value={repoFullName}
            onValueChange={setRepoFullName}
          >
            <SelectTrigger
              id="branch-repo"
              disabled={reposQuery.isPending}
            >
              <SelectValue
                placeholder={reposQuery.isPending ? '저장소 불러오는 중…' : '저장소 선택'}
              />
            </SelectTrigger>
            <SelectContent>
              {reposQuery.data?.map((repo) => (
                <SelectItem
                  key={repo.full_name}
                  value={repo.full_name}
                >
                  {repo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRepo && (
            <FieldDescription>
              기본 브랜치 {selectedRepo.default_branch}에서 생성됩니다.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="branch-name">브랜치 이름</FieldLabel>
          <Input
            id="branch-name"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}
