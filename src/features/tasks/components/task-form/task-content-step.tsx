import { Controller, useFormContext } from 'react-hook-form'

import type { Attachment } from '@/features/tasks/api/types'
import { RichTextEditor } from '@/features/tasks/components/rich-text-editor'
import type { TaskFormValues } from '@/features/tasks/utils/task-form-schema'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

import { AttachmentField } from './attachment-field'
import { RequiredMark } from './required-mark'

type TaskContentStepProps = {
  withAttachments: boolean
  /** 이미 붙어 있는 첨부 — 수정에서만 있다 */
  existingAttachments?: Attachment[]
}

/** 화면 3 — 작업 등록 Step 1 (작업 내용). 목표일·우선순위 등 메타 필드는 모달 aside에 있다 */
export function TaskContentStep({ withAttachments, existingAttachments }: TaskContentStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<TaskFormValues>()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="task-title">
          요청제목 <RequiredMark />
        </FieldLabel>
        <Input
          id="task-title"
          {...register('title')}
          aria-invalid={Boolean(errors.title)}
        />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field>
        <FieldLabel>
          상세내용 <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError errors={[errors.description]} />
      </Field>

      {withAttachments && (
        <Field>
          <FieldLabel>파일첨부</FieldLabel>
          <AttachmentField existing={existingAttachments} />
        </Field>
      )}
    </div>
  )
}
