import Rx, {Observable as O} from "rx"
import R_ from "ramda"
import L_ from "partial.lenses"
import {makeModelDriver} from "./model"

const keys = x => x ? Object.keys(x) : []
const extend = Object.assign
const isFun = x => x && typeof x === "function"

const flattenBy = (list$$, keys, fn) =>
  keys.reduce((acc, k) => ({...acc, [k]: list$$.flatMapLatest(fn(k))}), {})

// ==== public stuff ====

export const R = R_

export const L = L_

export const Model = makeModelDriver

export const flatCombine = (list$$, ...keys) =>
  flattenBy(list$$, keys, k => xs => !xs.length ? O.just([]) : O.combineLatest(...xs.map(x => x[k])))

export const flatMerge = (list$$, ...keys) =>
  flattenBy(list$$, keys, k => xs => O.merge(xs.map(x => x[k] || O.empty())))

export const mergeByKeys = (...objects) => {
  const merged = {}
  objects.forEach(o => keys(o).forEach(k => merged[k] = merged[k] ? merged[k].merge(o[k]) : o[k]))
  return merged
}

export const liftListBy = (function () {
  const liftListBy = R.curryN(3, function liftListBy(identity, list$, it, replay = ["DOM"]) {
    return O.using(() => new Cache(replay), cache => {
      return list$
        .distinctUntilChanged(items => items.map(item => identity(item)), (a, b) => {
          if (a.length !== b.length) return false
          for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false
          }
          return true
        })
        .map(items => {
          const itemByKey = {}
          items.forEach((item, idx) => itemByKey[identity(item)] = {item, idx})
          items.forEach((item, idx) => {
            const key = identity(item)
            if (!cache.contains(key)) {
              const item$ = isFun(list$.lens) ? list$.lens(L.find(R.compose(R.equals(key), identity))) : null
              cache.put(key, it(key, item$), idx)
            } else {
              cache.reIndex(key, idx)
            }
          })
          cache.keys().forEach(key => {
            if (!(key in itemByKey)) {
              cache.del(key)
            }
          })
          return cache.list()
        })
    }).shareReplay(1)
  })

  function Cache(toReplay) {
    this.cache = {}
    this.toReplay = toReplay.reduce((acc, k) => ({...acc, [k]: true}), {})
  }

  extend(Cache.prototype, {
    contains(key) {
      return key in this.cache
    },
    put(key, sinks, idx) {
      const streams = {}
      const disposable = new Rx.CompositeDisposable()
      keys(sinks).map(name => {
        const sink$ = this.toReplay[name] ? sinks[name].replay(null, 1) : sinks[name].publish()
        disposable.add(sink$.connect())
        streams[name] = sink$
      })
      this.cache[key] = {
        key,
        streams,
        disposable,
        idx
      }
    },
    reIndex(key, idx) {
      this.cache[key].idx = idx
    },
    del(key) {
      const cached = this.cache[key]
      if (cached) {
        delete this.cache[key]
        cached.disposable.dispose()
      }
    },
    keys() {
      return keys(this.cache)
    },
    list() {
      const list = keys(this.cache).map(k => this.cache[k])
      list.sort((a, b) => a.idx - b.idx)
      return list.map(x => x.streams)
    },
    dispose() {
      this.toReplay = []
      keys(this.cache).forEach(key => {
        this.del(key)
      })
    }
  })

  return liftListBy
})();

export const liftListById = liftListBy(R.prop("id"))
