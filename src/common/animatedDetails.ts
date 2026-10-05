import './animatedDetails.css'
import type { ObjectDirective } from 'vue'

type State = {
  expanded: boolean
  animation?: Animation
  click: (event: MouseEvent) => void
  toggle: () => void
}
const states = new WeakMap<HTMLDetailsElement, State>()

/** Retain native summary keyboard behavior and keep closing content painted until completion. */
export const vAnimatedDetails: ObjectDirective<HTMLDetailsElement> = {
  mounted(element) {
    const summary = element.querySelector(':scope > summary') as HTMLElement | null
    const content = element.querySelector(':scope > .facility-content') as HTMLElement | null
    if (!summary || !content) return
    const syncIndicator = (expanded: boolean) => {
      element.dataset.detailsExpanded = String(expanded)
    }
    syncIndicator(element.open)
    const state: State = {
      expanded: element.open,
      toggle() {
        if (!state.animation) syncIndicator(element.open)
      },
      click(event) {
        event.preventDefault()
        const start = element.open ? content.getBoundingClientRect().height : 0
        state.expanded = !(state.animation ? state.expanded : element.open)
        syncIndicator(state.expanded)
        state.animation?.cancel()
        state.animation = undefined
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          element.open = state.expanded
          return
        }
        // Clip only the content, excluding the summary and the group's bottom padding.
        element.open = true
        const end = state.expanded ? content.getBoundingClientRect().height : 0
        const animation = content.animate(
          [
            { height: `${start}px`, overflow: 'hidden' },
            { height: `${end}px`, overflow: 'hidden' },
          ],
          {
            duration: 260,
            easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
            // Keep the final clip until native details is closed in onfinish.
            fill: 'both',
          },
        )
        state.animation = animation
        animation.onfinish = () => {
          if (state.animation !== animation) return
          element.open = state.expanded
          state.animation = undefined
          animation.cancel()
        }
      },
    }
    states.set(element, state)
    summary.addEventListener('click', state.click)
    element.addEventListener('toggle', state.toggle)
  },
  beforeUnmount(element) {
    const state = states.get(element)
    state?.animation?.cancel()
    if (state) element.removeEventListener('toggle', state.toggle)
    delete element.dataset.detailsExpanded
    if (state)
      element
        .querySelector(':scope > summary')
        ?.removeEventListener('click', state.click as EventListener)
    states.delete(element)
  },
}
