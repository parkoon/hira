import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'

/** 폼 값과 API가 모두 'yyyy-MM-dd' 문자열이라 Date로 들고 다니지 않는다 */
const VALUE_FORMAT = 'yyyy-MM-dd'

type DatePickerProps = Omit<
  React.ComponentProps<typeof Button>,
  'value' | 'onChange' | 'children'
> & {
  /** 'yyyy-MM-dd' 또는 미선택 시 빈 문자열 */
  value: string
  onChange: (value: string) => void
  /** 이 날짜 이전은 선택할 수 없다 */
  minDate?: Date
  placeholder?: string
}

function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = '날짜 선택',
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          // Input과 같은 높이(h-8)를 쓰는 사이즈라 같은 폼 안에서 줄이 맞는다
          size="lg"
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          {...props}
        >
          {value || placeholder}
          <CalendarIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
      >
        <Calendar
          mode="single"
          locale={ko}
          selected={selected}
          defaultMonth={selected}
          disabled={minDate && { before: minDate }}
          onSelect={(date) => {
            onChange(date ? format(date, VALUE_FORMAT) : '')
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
