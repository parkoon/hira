import { Controller, useFormContext } from 'react-hook-form'

import { RichTextEditor } from '@/features/issues/components/rich-text-editor'
import type { RequestFormValues } from '@/features/issues/utils/request-form-schema'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

import { AttachmentField } from './attachment-field'
import { RequiredMark } from './required-mark'

/** 화면 3 — 이슈 등록 Step 1 (이슈 내용). 완료요청일·우선순위 등 메타 필드는 모달 aside에 있다 */
export function RequestContentStep({ withAttachments }: { withAttachments: boolean }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RequestFormValues>()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="request-title">
          요청제목 <RequiredMark />
        </FieldLabel>
        <Input
          id="request-title"
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
          <AttachmentField />
        </Field>
      )}
    </div>
  )
}
