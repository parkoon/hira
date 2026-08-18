import type { User } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'

/** 하위작업 작업자로 지정할 수 있는 사용자 — 작업자 이상 (스펙 §5.1) */
export function selectAssignableUsers(users: User[]): User[] {
  return users.filter((user) => ROLE_LEVEL[user.role] >= ROLE_LEVEL.WORKER)
}
