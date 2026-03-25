import { useCallback, useRef } from 'react'
import { LONG_PRESS_DELAY_MS } from '@/utils/constants'

interface LongPressHandlers {
  readonly onTouchStart: (e: React.TouchEvent) => void
  readonly onTouchEnd: () => void
  readonly onTouchMove: () => void
  readonly onContextMenu: (e: React.MouseEvent) => void
}

export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventRef = useRef<React.TouchEvent | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      eventRef.current = e
      timerRef.current = setTimeout(() => {
        if (eventRef.current) onLongPress(eventRef.current)
      }, LONG_PRESS_DELAY_MS)
    },
    [onLongPress],
  )

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onLongPress(e)
    },
    [onLongPress],
  )

  return { onTouchStart, onTouchEnd: clear, onTouchMove: clear, onContextMenu }
}
