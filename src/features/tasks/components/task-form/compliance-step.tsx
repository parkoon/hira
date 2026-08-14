import { Controller, useFormContext } from 'react-hook-form'

import type { TaskFormValues } from '@/features/tasks/utils/task-form-schema'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'

import { RequiredMark } from './required-mark'

/** 화면 4 — 작업 등록 Step 2 (컴플라이언스 확인). 미응답 시 제출 불가 (스펙 §4.1) */
export function ComplianceStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext<TaskFormValues>()

  return (
    <div className="space-y-6">
      <Field>
        <FieldLabel>
          해당 요건이 개인정보를 다루는 작업인가요? <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="handlesPersonalData"
          render={({ field }) => (
            <RadioGroup
              value={field.value ?? ''}
              onValueChange={field.onChange}
              className="mt-1 flex gap-5"
            >
              <FieldLabel
                htmlFor="personal-data-yes"
                className="items-center font-normal"
              >
                <RadioGroupItem
                  id="personal-data-yes"
                  value="YES"
                />
                예
              </FieldLabel>
              <FieldLabel
                htmlFor="personal-data-no"
                className="items-center font-normal"
              >
                <RadioGroupItem
                  id="personal-data-no"
                  value="NO"
                />
                아니오
              </FieldLabel>
            </RadioGroup>
          )}
        />
        <FieldError errors={[errors.handlesPersonalData]} />
        <div className="mt-2 rounded bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800 dark:bg-red-950/60 dark:text-red-300">
          &quot;예&quot; 선택 시 승인 화면에서 리드에게 강조 표시됩니다. 개인정보 취급 요건은 관련
          보안 절차를 준수해야 합니다.
        </div>
      </Field>

      <Field>
        <FieldLabel>
          해당 요건이 소비자보호 승인 대상인가요? <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="consumerProtectionTarget"
          render={({ field }) => (
            <RadioGroup
              value={field.value ?? ''}
              onValueChange={field.onChange}
              className="mt-1 flex gap-5"
            >
              <FieldLabel
                htmlFor="consumer-protection-yes"
                className="items-center font-normal"
              >
                <RadioGroupItem
                  id="consumer-protection-yes"
                  value="YES"
                />
                예
              </FieldLabel>
              <FieldLabel
                htmlFor="consumer-protection-no"
                className="items-center font-normal"
              >
                <RadioGroupItem
                  id="consumer-protection-no"
                  value="NO"
                />
                아니오
              </FieldLabel>
            </RadioGroup>
          )}
        />
        <FieldError errors={[errors.consumerProtectionTarget]} />
        <div className="mt-2 rounded bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          &quot;예&quot; 선택 시 하위작업 인수테스트 단계에서 소비자보호 검증 1·2차 기록이
          필요합니다.
        </div>
      </Field>

      <Field>
        <FieldLabel>
          해당 요건에 다크패턴이 없는 것을 확인했나요? <RequiredMark />
        </FieldLabel>
        <Controller
          control={control}
          name="darkPatternChecked"
          render={({ field }) => (
            <FieldLabel
              htmlFor="dark-pattern-checked"
              className="mt-1 items-start text-[13px] font-normal"
            >
              <Checkbox
                id="dark-pattern-checked"
                className="mt-0.5"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              사용자를 기만하거나 유도하는 UI/문구(다크패턴)가 포함되지 않았음을 확인했습니다
            </FieldLabel>
          )}
        />
        <FieldError errors={[errors.darkPatternChecked]} />
      </Field>

      <p className="text-muted-foreground border-t pt-3 text-[11px]">
        승인을 요청한 뒤에는 수정할 수 없어요. 수정이 필요하면 회수 후 다시 요청하세요
      </p>
    </div>
  )
}
