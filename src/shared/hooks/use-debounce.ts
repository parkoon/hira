import { useEffect, useState } from 'react'

/**
 * 값의 변경을 지연시킵니다. 검색 입력 등에서 불필요한 API 호출을 줄일 때 사용합니다.
 *
 * @param value - 디바운스할 값
 * @param delayMs - 지연 시간 (밀리초, 기본 300ms)
 */
export function useDebounceValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debouncedValue
}
