import { Controller, useFormContext } from 'react-hook-form'

import type { TaskActor } from '@/features/tasks/api/types'
import { PRIORITY_META } from '@/features/tasks/constants/metadata'
import type { TaskFormValues } from '@/features/tasks/utils/task-form-schema'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
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

/** 작업 등록 모달의 보조 패널 — 스텝이 바뀌어도 계속 보이는 메타 필드 */
export function TaskMetaAside({ consultableUsers }: { consultableUsers: TaskActor[] }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TaskFormValues>()

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="task-due-date">
          완료요청일 <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DatePicker
              id="task-due-date"
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
        <FieldLabel htmlFor="task-priority">
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
                id="task-priority"
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

      <Field>
        <FieldLabel htmlFor="task-consultant">
          사전협의자 <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="consultantId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="task-consultant"
                className="w-full"
                aria-invalid={Boolean(errors.consultantId)}
              >
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {consultableUsers.map((user) => (
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
        <FieldError errors={[errors.consultantId]} />
      </Field>
    </div>
  )
}
