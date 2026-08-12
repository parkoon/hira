import { Controller, useFormContext } from 'react-hook-form'

import { PRIORITY_META } from '@/features/issues/constants/metadata'
import type { RequestFormValues } from '@/features/issues/utils/request-form-schema'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { toEnumOptions } from '@/shared/utils/enum'

import { ReferenceLinkField } from './reference-link-field'
import { RequiredMark } from './required-mark'

const priorityOptions = toEnumOptions(PRIORITY_META)

/** 이슈 등록 모달의 보조 패널 — 스텝이 바뀌어도 계속 보이는 메타 필드 */
export function RequestMetaAside() {
  const { user } = useCurrentUser()
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RequestFormValues>()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="request-due-date">
          완료요청일 <RequiredMark />
        </FieldLabel>
        <Input
          id="request-due-date"
          type="date"
          {...register('dueDate')}
          aria-invalid={Boolean(errors.dueDate)}
        />
        <FieldDescription className="text-[11px]">
          오늘 이전 날짜는 선택할 수 없어요
        </FieldDescription>
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
        <FieldDescription className="text-[11px]">표시·정렬용</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>참고 링크</FieldLabel>
        <ReferenceLinkField />
      </Field>

      <Field>
        <FieldLabel>요청자</FieldLabel>
        <div className="flex items-center gap-2 text-[13px]">
          <NameAvatar name={user.name} />
          <span className="truncate">
            {user.name} · {user.dept}
          </span>
        </div>
        <FieldDescription className="text-[11px]">
          {user.contact} · 로그인 계정으로 고정
        </FieldDescription>
      </Field>
    </div>
  )
}
