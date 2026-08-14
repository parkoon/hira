import { Link } from 'react-router'

import { Button } from '@/shared/components/ui/button'
import { paths } from '@/shared/config/paths'

function NotFoundPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">페이지를 찾을 수 없습니다.</p>
      <Button
        asChild
        variant="outline"
      >
        <Link to={paths.app.tasks.root.getHref()}>작업 목록으로 이동</Link>
      </Button>
    </div>
  )
}

export { NotFoundPage as Component }
