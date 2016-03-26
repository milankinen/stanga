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
