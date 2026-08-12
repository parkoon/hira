import { Badge } from '@/shared/components/ui/badge'

type Env = 'dev' | 'stg' | 'prd'

const ENV_CONFIG: Record<Env, { label: string; className: string }> = {
  dev: {
    label: '개발',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  stg: {
    label: '검증',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  prd: {
    label: '운영',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
}

function getEnv(): Env {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname.includes('.dev.')) return 'dev'
  if (hostname.includes('.stage.')) return 'stg'
  return 'prd'
}

export function EnvBadge() {
  const env = getEnv()
  const { label, className } = ENV_CONFIG[env]

  return (
    <Badge
      variant="outline"
      className={className}
    >
      {label}
    </Badge>
  )
}
