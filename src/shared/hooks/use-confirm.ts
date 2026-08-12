import { type ComponentProps, type ReactNode, useMemo } from 'react'
import { create } from 'zustand'

import type { Button } from '@/shared/components/ui/button'

type ButtonVariant = ComponentProps<typeof Button>['variant']

type ConfirmButtonProps = {
  text?: ReactNode
  variant?: ButtonVariant
}

export type ConfirmOptions = {
  title: ReactNode
  description?: ReactNode
  confirm?: ConfirmButtonProps
  cancel?: ConfirmButtonProps
}

type ConfirmStore = {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((ok: boolean) => void) | null
  _open: (options: ConfirmOptions, resolve: (ok: boolean) => void) => void
  _close: () => void
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  options: null,
  resolve: null,
  _open: (options, resolve) => set({ isOpen: true, options, resolve }),
  _close: () => set({ isOpen: false, resolve: null }),
}))

/**
 * 반환값은 렌더 간 안정적이어야 한다 — 호출 측이 이 값을 `useCallback` 의존성으로 쓰고,
 * 그 콜백이 다시 ag-grid `columnDefs` 메모이제이션에 물려 있다.
 * 매 렌더 새 객체를 돌려주면 그 체인이 통째로 무효화된다.
 */
export const useConfirm = () => {
  const _open = useConfirmStore((s) => s._open)

  return useMemo(
    () => ({
      open: (options: ConfirmOptions): Promise<boolean> =>
        new Promise((resolve) => _open(options, resolve)),
    }),
    [_open]
  )
}
