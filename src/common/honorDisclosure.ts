import './animatedDetails.css'
import type { ObjectDirective } from 'vue'

const cleanups = new WeakMap<HTMLDetailsElement, () => void>()
const timing = {
  duration: 260,
  easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  fill: 'both' as const,
}

/** Move the honor summary into its own row before revealing its content. */
export const vHonorDisclosure: ObjectDirective<HTMLDetailsElement> = {
  mounted(element) {
    const layout = element.closest<HTMLElement>('.season-facts')
    const rating = layout?.querySelector<HTMLElement>('.rating-summary')
    const summary = element.querySelector<HTMLElement>(':scope > summary')
    const content = element.querySelector<HTMLElement>(':scope > .facility-content')
    if (!layout || !rating || !summary || !content) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let desired = element.open
    let expanded = element.open
    let stacked = element.open
    let busy = false
    let disposed = false
    let animations: Animation[] = []
    layout.dataset.honorsLayout = stacked ? 'expanded' : 'collapsed'
    element.dataset.detailsExpanded = String(expanded)

    async function play(batch: Animation[]) {
      animations = batch
      await Promise.all(batch.map((animation) => animation.finished.catch(() => undefined)))
    }
    function cancelAnimations() {
      for (const animation of animations) animation.cancel()
      animations = []
    }
    async function move(toStacked: boolean) {
      const items = [rating!, element]
      const before = items.map((item) => item.getBoundingClientRect())
      const height = layout!.getBoundingClientRect().height
      layout!.dataset.honorsLayout = toStacked ? 'expanded' : 'collapsed'
      const after = items.map((item) => item.getBoundingClientRect())
      const nextHeight = layout!.getBoundingClientRect().height
      const changed = before.some((rect, index) => {
        const next = after[index]!
        return (
          Math.abs(rect.x - next.x) +
            Math.abs(rect.y - next.y) +
            Math.abs(rect.width - next.width) +
            Math.abs(rect.height - next.height) >
          1
        )
      })
      // Mobile already stacks both summaries, so proceed straight to the disclosure.
      if (!motion.matches && changed) {
        element.dataset.detailsPhase = 'layout'
        await play([
          layout!.animate([{ height: `${height}px` }, { height: `${nextHeight}px` }], timing),
          ...items.map((item, index) => {
            const first = before[index]!
            const last = after[index]!
            return item.animate(
              [
                {
                  width: `${first.width}px`,
                  height: `${first.height}px`,
                  transform: `translate(${first.x - last.x}px, ${first.y - last.y}px)`,
                },
                {
                  width: `${last.width}px`,
                  height: `${last.height}px`,
                  transform: 'translate(0, 0)',
                },
              ],
              timing,
            )
          }),
        ])
        cancelAnimations()
      }
      stacked = toStacked
    }
    async function reveal(toExpanded: boolean) {
      const start = element.open ? content!.getBoundingClientRect().height : 0
      element.open = true
      element.dataset.detailsExpanded = String(toExpanded)
      const end = toExpanded ? content!.getBoundingClientRect().height : 0
      if (!motion.matches) {
        element.dataset.detailsPhase = 'content'
        await play([
          content!.animate(
            [
              { height: `${start}px`, overflow: 'hidden' },
              { height: `${end}px`, overflow: 'hidden' },
            ],
            timing,
          ),
        ])
      }
      element.open = toExpanded
      cancelAnimations()
      expanded = toExpanded
    }
    async function settle() {
      if (busy) return
      busy = true
      try {
        // A rapid click updates the destination; finish the current leg before reversing.
        while (!disposed && (stacked !== desired || expanded !== desired)) {
          if (desired) {
            if (!stacked) await move(true)
            else await reveal(true)
          } else {
            if (expanded) await reveal(false)
            else await move(false)
          }
        }
      } finally {
        busy = false
        if (!disposed) element.dataset.detailsPhase = 'idle'
      }
    }
    const click = (event: MouseEvent) => {
      event.preventDefault()
      desired = !desired
      void settle()
    }
    // Width changes invalidate measured endpoints. Finish that leg at its natural size.
    let width = layout.getBoundingClientRect().width
    const observer = new ResizeObserver(() => {
      const next = layout.getBoundingClientRect().width
      if (Math.abs(next - width) > 1) cancelAnimations()
      width = next
    })
    observer.observe(layout)
    const changeMotion = () => {
      if (motion.matches) cancelAnimations()
    }
    motion.addEventListener('change', changeMotion)
    summary.addEventListener('click', click)
    cleanups.set(element, () => {
      disposed = true
      observer.disconnect()
      motion.removeEventListener('change', changeMotion)
      summary.removeEventListener('click', click)
      cancelAnimations()
    })
  },
  beforeUnmount(element) {
    cleanups.get(element)?.()
    cleanups.delete(element)
  },
}
