import { PlusIcon, XIcon } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import type { RequestFormValues } from '@/features/issues/utils/request-form-schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

/** 참고 링크 — URL 다중 입력 (스펙 §4.1) */
export function ReferenceLinkField() {
  const { control, register } = useFormContext<RequestFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'referenceLinks' })

  return (
    <div className="space-y-1.5">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-center gap-1"
        >
          <Input
            {...register(`referenceLinks.${index}.url`)}
            placeholder="https://wiki.example.com/..."
            aria-label={`참고 링크 ${index + 1}`}
          />
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`참고 링크 ${index + 1} 삭제`}
              onClick={() => remove(index)}
            >
              <XIcon />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ url: '' })}
      >
        <PlusIcon />
        링크 추가
      </Button>
    </div>
  )
}
