class PropertyHook {
  constructor(fn) {
    this.fn = fn
  }

  hook() {
    this.fn.apply(this, arguments)
  }
}

export function propHook(fn) {
  return new PropertyHook(fn)
}

export const ENTER_KEY = 13
export const ESC_KEY = 27

export function getFilterFn(filterName) {
  const filters = {
    default: () => true,
    active: ({completed}) => !completed,
    completed: ({completed}) => completed === true
  }

  return filters[filterName] || filters.default
}
