import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { User } from '@/features/users/api/types'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

export const userFilterParsers = {
  q: parseAsString.withDefault(''),
  role: parseAsArrayOf(parseAsString).withDefault([]),
}

type UserFilters = {
  q: string
  role: string[]
}

export function applyUserFilters(users: User[], filters: UserFilters): User[] {
  const keyword = filters.q.trim().toLowerCase()
  const roles = filters.role.filter((value) => isKnownEnumValue(USER_ROLE_META, value))

  return users.filter((user) => {
    if (roles.length > 0 && !roles.includes(user.role)) {
      return false
    }
    if (keyword.length === 0) return true
    return [user.name, user.loginId, user.dept].some((field) =>
      field.toLowerCase().includes(keyword)
    )
  })
}
