import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { SubtaskType } from '@/features/issues/api/types'
import { RichTextEditor } from '@/features/issues/components/rich-text-editor'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

/** 하위작업 등록 항목 — 스펙 §5.1. 이슈유형이 워크플로를 결정하며 생성 후 변경 불가 */
const subtaskFormSchema = z.object({
  type: z.enum(['DEPLOY', 'NON_DEPLOY'], { message: '이슈유형을 선택해 주세요' }),
  title: z.string().trim().min(1, '제목을 입력해 주세요'),
  description: z.string().trim(),
  assigneeLoginId: z.string().min(1, '담당자를 선택해 주세요'),
  dueDate: z.string(),
})

type SubtaskFormValues = z.infer<typeof subtaskFormSchema>

export type SubtaskCreateResult = {
  type: SubtaskType
  title: string
  description: string
  assigneeLoginId: string
  dueDate: string | null
}

type SubtaskCreateModalProps = {
  parentIssueNo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SubtaskCreateResult) => void
}

const FORM_ID = 'subtask-create-form'

export function SubtaskCreateModal({
  parentIssueNo,
  open,
  onOpenChange,
  onSubmit,
}: SubtaskCreateModalProps) {
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const assignableUsers = selectAssignableUsers(usersQuery.data)

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskFormSchema),
    defaultValues: { title: '', description: '', assigneeLoginId: '', dueDate: '' },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      type: values.type,
      title: values.title,
      description: values.description,
      assigneeLoginId: values.assigneeLoginId,
      dueDate: values.dueDate.length > 0 ? values.dueDate : null,
    })
    form.reset()
    onOpenChange(false)
  })

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="하위작업 생성"
      description="생성 시 상태는 작업대기중입니다."
      // 필드가 적어 기본 고정 높이(640px)를 쓰면 아래가 비므로 내용 높이를 따르게 한다.
      // max-h는 확장 시 높이(100dvh-2rem)와 맞춰야 확장이 화면을 다 채운다
      className="h-auto max-h-[calc(100dvh-2rem)]"
      aside={
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="subtask-assignee">담당자</FieldLabel>
            <Controller
              control={form.control}
              name="assigneeLoginId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="subtask-assignee"
                    className="w-full"
                  >
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem
                        key={user.loginId}
                        value={user.loginId}
                      >
                        <span className="flex items-center gap-1.5">
                          <NameAvatar name={user.name} />
                          {user.name} · {user.dept}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.assigneeLoginId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="subtask-due-date">목표일</FieldLabel>
            <Input
              id="subtask-due-date"
              type="date"
              {...form.register('dueDate')}
            />
          </Field>

          <Field>
            <FieldLabel>상위이슈</FieldLabel>
            <span className="text-[13px] font-medium">{parentIssueNo}</span>
          </Field>
        </div>
      }
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{ label: '생성', type: 'submit', form: FORM_ID }}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Field>
          <FieldLabel>이슈유형</FieldLabel>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ''}
                onValueChange={field.onChange}
                className="mt-1 gap-2"
              >
                <FieldLabel
                  htmlFor="subtask-type-deploy"
                  className="items-center font-normal"
                >
                  <RadioGroupItem
                    id="subtask-type-deploy"
                    value="DEPLOY"
                  />
                  배포형
                  <span className="text-muted-foreground text-[11px]">
                    운영 배포가 필요한 작업 · 8단계 워크플로
                  </span>
                </FieldLabel>
                <FieldLabel
                  htmlFor="subtask-type-non-deploy"
                  className="items-center font-normal"
                >
                  <RadioGroupItem
                    id="subtask-type-non-deploy"
                    value="NON_DEPLOY"
                  />
                  비배포형
                  <span className="text-muted-foreground text-[11px]">
                    문서 작업 등 배포 무관 · 4단계 워크플로
                  </span>
                </FieldLabel>
              </RadioGroup>
            )}
          />
          <FieldDescription className="text-[11px]">생성 후에는 변경할 수 없어요</FieldDescription>
          <FieldError errors={[form.formState.errors.type]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="subtask-title">제목</FieldLabel>
          <Input
            id="subtask-title"
            autoFocus
            {...form.register('title')}
            aria-invalid={Boolean(form.formState.errors.title)}
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>

        <Field>
          <FieldLabel>설명</FieldLabel>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
      </form>
    </Modal>
  )
}
