import { Controller, useFormContext } from 'react-hook-form'

import { PRIORITY_META } from '@/features/issues/constants/metadata'
import type { RequestFormValues } from '@/features/issues/utils/request-form-schema'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { toEnumOptions } from '@/shared/utils/enum'

import { RequiredMark } from './required-mark'

const priorityOptions = toEnumOptions(PRIORITY_META)

/** 이슈 등록 모달의 보조 패널 — 스텝이 바뀌어도 계속 보이는 메타 필드 */
export function RequestMetaAside() {
  const {
    control,
    formState: { errors },
  } = useFormContext<RequestFormValues>()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="request-due-date">
          완료요청일 <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DatePicker
              id="request-due-date"
              value={field.value}
              onChange={field.onChange}
              minDate={new Date()}
              aria-invalid={Boolean(errors.dueDate)}
            />
          )}
        />
        <FieldError errors={[errors.dueDate]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="request-priority">
          우선순위 <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="request-priority"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
    </div>
  )
}
