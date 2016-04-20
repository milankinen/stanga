import R from "ramda"
import L from "partial.lenses"
import {liftListBy as llb} from "./operators"

const extend = Object.assign

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
    state$ = state$.replay(null, 1)
    state$.connect()

    return model(toProp(state$), R.lens(R.identity, R.nthArg(0)))

    function model(state$, modLens) {
      const lens = (l, ...ls) =>
        model(toProp(state$.map(L.view(l, ...ls))), L(modLens, l, ...ls))

      const mod = mod$ =>
        mod$.map(mod => ({mod: R.over(modLens, mod), ID}))

      const set = val$ =>
        val$.map(val => ({mod: R.over(modLens, R.always(val)), ID}))

      const log = prefix =>
        model(state$.do(s => info(prefix, s)).shareReplay(1), modLens)

      const liftListBy = (identity, it, replay = ["DOM"]) => {
        const iterator = (ident, item$) => {
          const l = L.find(item => identity(item) === ident)
          return it(ident, model(item$, L(modLens, l)))
        }
        return llb(identity, state$, iterator, replay)
      }

      const liftListById = liftListBy.bind(null, it => it.id)

      return extend(state$, {
        lens, mod, set, liftListBy, liftListById, log
      })
    }

    function toProp(val$) {
      return val$.distinctUntilChanged(x => x, R.equals).shareReplay(1)
    }
  }
}
