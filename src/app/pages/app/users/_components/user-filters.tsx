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
      // 줄바꿈 대신 가로 스크롤 — 필터가 늘어도 표 높이를 갉아먹지 않는다.
      // 자식까지 shrink를 막아야 눌리지 않고 실제로 넘쳐서 스크롤이 생긴다.
      className="flex-nowrap [&>*]:shrink-0"
    />
  )
}
