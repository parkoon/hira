import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { useConfirmStore } from '@/shared/hooks/use-confirm'

export function ConfirmDialog() {
  const { isOpen, options, resolve, _close } = useConfirmStore()

  const handleResult = (ok: boolean) => {
    resolve?.(ok)
    _close()
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleResult(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description ? (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            variant={options?.cancel?.variant ?? 'outline'}
            onClick={() => handleResult(false)}
          >
            {options?.cancel?.text ?? '취소'}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={options?.confirm?.variant ?? 'default'}
            onClick={() => handleResult(true)}
          >
            {options?.confirm?.text ?? '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
