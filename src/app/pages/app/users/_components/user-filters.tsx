import { useQueryStates } from 'nuqs'

import { MANAGED_ROLES, USER_ROLE_META } from '@/features/users/constants/metadata'
import { FilterBar, type FilterBarField } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import { userFilterParsers } from '../_utils/user-filters'

const filterFields: FilterBarField[] = [
  { key: 'role', label: '역할', options: toEnumOptions(USER_ROLE_META, MANAGED_ROLES) },
]

export function UserFilters() {
  const [filters, setFilters] = useQueryStates(userFilterParsers)

  return (
    <FilterBar
      fields={filterFields}
      value={{ role: filters.role }}
      onChange={(value) => void setFilters({ role: value.role ?? [] })}
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="이름, 사번, 부서 검색"
    />
  )
}
