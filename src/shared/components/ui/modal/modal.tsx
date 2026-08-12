'use client'

import { Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

type ModalActionProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  label: React.ReactNode
}

type ModalProps = {
  /** 제어 모드: 외부 state로 열림/닫힘을 관리 */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 클릭 시 모달을 여는 요소. asChild로 감싸지므로 단일 엘리먼트를 전달 */
  trigger?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  /** 본문 콘텐츠 */
  children?: React.ReactNode
  /** 본문 오른쪽 보조 패널 */
  aside?: React.ReactNode
  primaryAction?: ModalActionProps
  secondaryAction?: ModalActionProps
  /** 툴바 오른쪽 영역 (확장/닫기 버튼 왼쪽) */
  headerActions?: React.ReactNode
  /** 확장(높이 꽉 채우기) 버튼 노출 여부 */
  expandable?: boolean
  /** 닫기 버튼 노출 여부 */
  showCloseButton?: boolean
  /** body 패딩 제거 (콘텐츠를 모달 엣지에 딱 붙일 때) */
  noBodyPadding?: boolean
  /** 모달 컨테이너에 적용할 클래스 */
  className?: string
  /** 각 슬롯에 적용할 클래스 */
  classNames?: {
    body?: string
  }
}

function renderAction(action: ModalActionProps, defaultVariant: 'default' | 'outline') {
  const { label, variant = defaultVariant, type = 'button', ...rest } = action
  return (
    <Button
      variant={variant}
      type={type}
      {...rest}
    >
      {label}
    </Button>
  )
}

function Modal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  aside,
  primaryAction,
  secondaryAction,
  headerActions,
  expandable = true,
  showCloseButton = true,
  noBodyPadding = false,
  className,
  classNames,
}: ModalProps) {
  const [expanded, setExpanded] = React.useState(false)

  const hasFooter = Boolean(primaryAction || secondaryAction)

  return (
    <DialogPrimitive.Root
      data-slot="modal"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {trigger && (
        <DialogPrimitive.Trigger
          data-slot="modal-trigger"
          asChild
        >
          {trigger}
        </DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal data-slot="modal-portal">
        <DialogPrimitive.Overlay
          data-slot="modal-overlay"
          className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs"
        />
        <DialogPrimitive.Content
          data-slot="modal-content"
          data-expanded={expanded}
          className={cn(
            'bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl text-sm ring-1 transition-[height,max-width] duration-200 ease-out outline-none sm:max-w-3xl',
            !expanded && 'h-[min(640px,85dvh)]',
            className,
            // 확장 클래스는 className보다 뒤에 둬서, 커스텀 너비(sm:max-w-*)를 줘도 확장이 항상 우선하도록 한다
            expanded && 'h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)]'
          )}
        >
          <div
            data-slot="modal-toolbar"
            className="flex shrink-0 items-center gap-2 border-b px-4 py-2"
          >
            <div className="flex min-w-0 flex-1 items-center">
              {title && (
                <DialogPrimitive.Title
                  data-slot="modal-title"
                  className="font-heading text-base leading-tight font-semibold"
                >
                  {title}
                </DialogPrimitive.Title>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {headerActions}
              {expandable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
                  <span className="sr-only">{expanded ? '모달 축소' : '모달 확장'}</span>
                </Button>
              )}
              {showCloseButton && (
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                  >
                    <XIcon />
                    <span className="sr-only">닫기</span>
                  </Button>
                </DialogPrimitive.Close>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {description && (
                <DialogPrimitive.Description
                  data-slot="modal-description"
                  className="text-muted-foreground shrink-0 px-4 pt-4 text-sm"
                >
                  {description}
                </DialogPrimitive.Description>
              )}
              <div
                data-slot="modal-body"
                className={cn(
                  'flex-1 overflow-y-auto',
                  !noBodyPadding && 'px-4 py-4',
                  classNames?.body
                )}
              >
                {children}
              </div>
            </div>

            {aside && (
              <aside
                data-slot="modal-aside"
                className="w-72 shrink-0 overflow-y-auto border-l p-4"
              >
                {aside}
              </aside>
            )}
          </div>

          {hasFooter && (
            <div
              data-slot="modal-footer"
              className="flex shrink-0 justify-end gap-2 border-t px-4 py-2"
            >
              {secondaryAction && renderAction(secondaryAction, 'outline')}
              {primaryAction && renderAction(primaryAction, 'default')}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { Modal }
export type { ModalActionProps, ModalProps }
