import R from "ramda"
import L from "partial.lenses"

export function makeModelDriver(initial, opts = {}) {
  const ID = {}
  const {
    logging = false,
    info = (...args) => console.info(...args),      // eslint-disable-line
    warn = (...args) => console.warn(...args)       // eslint-disable-line
    } = opts


  return function ModelDriver(mod$) {
    let state$ = mod$
      .filter(m => (m && m.ID === ID) || (warn(
        "Received modification that was not created by using 'M.mods'. Ignoring.."
      ) && false))
      .startWith(initial)
      .scan((s, {mod}) => mod(s))

    if (logging) {
      state$ = state$.do(s => info("New state:", s))
    }
    return model(state$, R.lens(R.identity, R.nthArg(0)))

    function model(state$, stateLens) {
      const val$ = state$
        .distinctUntilChanged()
        .shareReplay(1)

      return Object.assign(val$, {
        lens: (l, ...ls) => model(val$.map(L.view(L(l, ...ls))), L(stateLens, l, ...ls)),
        mod: mod$ => mod$.map(mod => ({mod: R.over(stateLens, mod), ID})),
        set: val$ => val$.map(val => ({mod: R.over(stateLens, R.always(val)), ID}))
      })
    }
  }
}
