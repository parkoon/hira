import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { IssueActor, SubtaskDraft, SubtaskType } from '@/features/issues/api/types'
import { RichTextEditor } from '@/features/issues/components/rich-text-editor'
import { SUBTASK_TYPE_META } from '@/features/issues/constants/metadata'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
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

/** 하위작업 등록 항목 — 스펙 §5.1 */
const subtaskFormSchema = z.object({
  type: z.enum(['DEPLOY', 'NON_DEPLOY'], { message: '이슈유형을 선택해 주세요' }),
  title: z.string().trim().min(1, '제목을 입력해 주세요'),
  description: z.string().trim(),
  assigneeId: z.string().min(1, '담당자를 선택해 주세요'),
  dueDate: z.string(),
})

type SubtaskFormValues = z.infer<typeof subtaskFormSchema>

type SubtaskFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  /** 담당자 후보 — 페이지가 조회해서 넘긴다 (모달을 열 때 화면이 서스펜드되지 않게) */
  assignableUsers: IssueActor[]
  /** 수정처럼 기존 값에서 시작할 때 */
  defaultValues?: Partial<SubtaskDraft>
  /**
   * 지정하면 이슈유형을 이 값으로 고정하고 선택 UI 대신 읽기 전용으로 보여준다 —
   * 워크플로를 결정하는 값이라 생성 후에는 바꿀 수 없다 (스펙 §5.1).
   */
  lockedType?: SubtaskType
  onSubmit: (values: SubtaskDraft) => void
}

const FORM_ID = 'subtask-form'

/** 하위작업 생성·수정이 같은 폼을 쓴다 — 차이는 이슈유형 고정 여부와 시작값뿐이다 */
export function SubtaskFormModal({
  open,
  onOpenChange,
  title,
  submitLabel,
  assignableUsers,
  defaultValues,
  lockedType,
  onSubmit,
}: SubtaskFormModalProps) {
  const currentAssignee = defaultValues?.assignee
  // 배정 후 역할이 내려간 담당자도 목록에 남겨야 선택값이 비어 보이지 않는다
  const assigneeOptions =
    currentAssignee && !assignableUsers.some((user) => user.id === currentAssignee.id)
      ? [currentAssignee, ...assignableUsers]
      : assignableUsers

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskFormSchema),
    defaultValues: {
      type: lockedType ?? defaultValues?.type,
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      assigneeId: currentAssignee?.id ?? '',
      dueDate: defaultValues?.dueDate ?? '',
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  const handleSubmit = form.handleSubmit((values) => {
    const assignee = assigneeOptions.find((candidate) => candidate.id === values.assigneeId)
    // 선택지에서 고른 값이라 벗어날 수 없다 — 타입을 좁히기 위한 가드
    if (!assignee) return

    onSubmit({
      type: values.type,
      title: values.title,
      description: values.description,
      assignee,
      dueDate: values.dueDate.length > 0 ? values.dueDate : null,
    })
    form.reset()
    onOpenChange(false)
  })

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      // 필드가 적어 기본 고정 높이(640px)를 쓰면 아래가 비므로 내용 높이를 따르게 한다.
      // max-h는 확장 시 높이(100dvh-2rem)와 맞춰야 확장이 화면을 다 채운다
      className="h-auto max-h-[calc(100dvh-2rem)]"
      aside={
        <div className="space-y-4">
          <Field>
            <FieldLabel>이슈유형</FieldLabel>
            {lockedType ? (
              <>
                <span className="text-[13px]">{SUBTASK_TYPE_META[lockedType].label}</span>
                <p className="text-muted-foreground text-[11px]">
                  워크플로를 결정하는 값이라 생성 후에는 바꿀 수 없어요
                </p>
              </>
            ) : (
              <>
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
                        className="items-start font-normal"
                      >
                        <RadioGroupItem
                          id="subtask-type-deploy"
                          value="DEPLOY"
                          className="mt-0.5"
                        />
                        <span className="flex flex-col gap-0.5">
                          배포형
                          <span className="text-muted-foreground text-[11px]">
                            운영 배포가 필요한 작업 · 8단계 워크플로
                          </span>
                        </span>
                      </FieldLabel>
                      <FieldLabel
                        htmlFor="subtask-type-non-deploy"
                        className="items-start font-normal"
                      >
                        <RadioGroupItem
                          id="subtask-type-non-deploy"
                          value="NON_DEPLOY"
                          className="mt-0.5"
                        />
                        <span className="flex flex-col gap-0.5">
                          비배포형
                          <span className="text-muted-foreground text-[11px]">
                            문서 작업 등 배포 무관 · 4단계 워크플로
                          </span>
                        </span>
                      </FieldLabel>
                    </RadioGroup>
                  )}
                />
                <FieldError errors={[form.formState.errors.type]} />
              </>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="subtask-assignee">담당자</FieldLabel>
            <Controller
              control={form.control}
              name="assigneeId"
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
                    {assigneeOptions.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
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
            <FieldError errors={[form.formState.errors.assigneeId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="subtask-due-date">목표일</FieldLabel>
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  id="subtask-due-date"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
      }
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{ label: submitLabel, type: 'submit', form: FORM_ID }}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
