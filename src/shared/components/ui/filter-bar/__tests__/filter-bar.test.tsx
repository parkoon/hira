import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  FilterBar,
  type FilterBarField,
  type FilterBarValue,
} from '@/shared/components/ui/filter-bar'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  )
})

const fields: FilterBarField[] = [
  {
    key: 'status',
    label: '상태',
    options: [
      { value: 'TODO', label: '할 일' },
      { value: 'IN_PROGRESS', label: '진행중' },
      { value: 'DONE', label: '완료' },
    ],
  },
  {
    key: 'priority',
    label: '우선순위',
    options: [
      { value: 'HIGH', label: '높음' },
      { value: 'LOW', label: '낮음' },
    ],
  },
  {
    key: 'period',
    label: '기간',
    multiple: false,
    options: [
      { value: '1M', label: '최근 1개월' },
      { value: '3M', label: '최근 3개월' },
    ],
  },
]

type HarnessProps = {
  initialValue?: FilterBarValue
  onChange?: (value: FilterBarValue) => void
  onSearchChange?: (search: string) => void
}

function Harness({ initialValue = {}, onChange, onSearchChange }: HarnessProps) {
  const [value, setValue] = useState<FilterBarValue>(initialValue)
  const [search, setSearch] = useState('')

  return (
    <FilterBar
      fields={fields}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      search={search}
      onSearchChange={(next) => {
        setSearch(next)
        onSearchChange?.(next)
      }}
      searchPlaceholder="검색"
    />
  )
}

function openFilterMenu() {
  fireEvent.click(screen.getByRole('button', { name: '필터' }))
}

describe('FilterBar', () => {
  it('필터 메뉴에서 필드 → 값을 선택하면 필터가 적용되고 칩이 생긴다', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    openFilterMenu()
    fireEvent.click(screen.getByRole('option', { name: '상태' }))
    fireEvent.click(screen.getByRole('option', { name: '진행중' }))

    expect(onChange).toHaveBeenCalledWith({ status: ['IN_PROGRESS'] })
    expect(screen.getByRole('button', { name: '상태 필터 제거' })).toBeInTheDocument()
  })

  it('값 라벨을 검색하면 필드를 건너뛰고 바로 적용할 수 있다', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    openFilterMenu()
    fireEvent.change(screen.getByPlaceholderText('필터 검색'), { target: { value: '진행' } })
    fireEvent.click(screen.getByRole('option', { name: '상태: 진행중' }))

    expect(onChange).toHaveBeenCalledWith({ status: ['IN_PROGRESS'] })
  })

  it('키보드(화살표/Enter)로 필드와 값을 선택할 수 있다', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    openFilterMenu()
    const input = screen.getByPlaceholderText('필터 검색')
    fireEvent.keyDown(input, { key: 'Enter' })

    const valueInput = screen.getByPlaceholderText('상태 검색')
    fireEvent.keyDown(valueInput, { key: 'ArrowDown' })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith({ status: ['IN_PROGRESS'] })
  })

  it('단일선택 필드는 값을 고르면 교체하고 팝오버를 닫는다', () => {
    const onChange = vi.fn()
    render(
      <Harness
        initialValue={{ period: ['3M'] }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '최근 3개월' }))
    fireEvent.click(screen.getByRole('option', { name: '최근 1개월' }))

    expect(onChange).toHaveBeenCalledWith({ period: ['1M'] })
    expect(screen.queryByRole('option', { name: '최근 1개월' })).not.toBeInTheDocument()
  })

  it('칩의 × 버튼으로 해당 필터를 제거한다', () => {
    const onChange = vi.fn()
    render(
      <Harness
        initialValue={{ status: ['DONE'] }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '상태 필터 제거' }))

    expect(onChange).toHaveBeenCalledWith({ status: [] })
    expect(screen.queryByRole('button', { name: '상태 필터 제거' })).not.toBeInTheDocument()
  })

  it('칩을 클릭해 값을 추가/해제할 수 있다', () => {
    const onChange = vi.fn()
    render(
      <Harness
        initialValue={{ status: ['DONE'] }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '완료' }))
    fireEvent.click(screen.getByRole('option', { name: '진행중' }))

    expect(onChange).toHaveBeenCalledWith({ status: ['DONE', 'IN_PROGRESS'] })
  })

  it('초기화 버튼이 모든 필터와 검색어를 비운다', () => {
    const onChange = vi.fn()
    const onSearchChange = vi.fn()
    render(
      <Harness
        initialValue={{ status: ['DONE'] }}
        onChange={onChange}
        onSearchChange={onSearchChange}
      />
    )

    fireEvent.change(screen.getByLabelText('검색'), { target: { value: 'HIRA-1' } })
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))

    expect(onChange).toHaveBeenCalledWith({})
    expect(onSearchChange).toHaveBeenLastCalledWith('')
    expect(screen.getByLabelText('검색')).toHaveValue('')
  })
})
