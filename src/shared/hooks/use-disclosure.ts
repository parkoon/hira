import { useCallback, useState } from 'react'

/**
 * Dialog, Modal, Drawer 등의 열림/닫힘 상태를 관리하는 훅
 *
 * @example
 * const dialog = useDisclosure()
 *
 * <Button onClick={dialog.open}>열기</Button>
 * <Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen}>
 *   <Button onClick={dialog.close}>닫기</Button>
 * </Dialog>
 */
export const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial)

  const setOpen = useCallback((open: boolean) => setIsOpen(open), [])
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((state) => !state), [])

  return { isOpen, setOpen, open, close, toggle }
}
