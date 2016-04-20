import Rx, {Observable as O} from "rx"

const keys = x => x ? Object.keys(x) : []
const extend = Object.assign

const flattenWith = (list$$, keys, fn) =>
  keys.reduce((acc, k) => ({...acc, [k]: list$$.flatMapLatest(fn(k))}), {})


export const flatCombine = (list$$, ...keys) =>
  flattenWith(list$$, keys, k => xs => !xs.length ? O.just([]) : O.combineLatest(...xs.map(x => x[k])))

export const flatMerge = (list$$, ...keys) =>
  flattenWith(list$$, keys, k => xs => O.merge(xs.map(x => x[k] || O.empty())))

export const mergeByKeys = (...objects) => {
  const merged = {}
  objects.forEach(o => keys(o).forEach(k => merged[k] = merged[k] ? merged[k].merge(o[k]) : o[k]))
  return merged
}

export const liftListBy = (function () {
  function liftListBy(identity, list$, it, replay = ["DOM"]) {
    return O.using(() => new Cache(replay), cache => {
      const indexed$ = list$
        .map(items => ({
          list: items,
          byKey: items.reduce((o, item) => (o[identity(item)] = item) && o, {})
        }))
        .shareReplay(1)

      return indexed$
        .distinctUntilChanged(i => i.list, (a, b) => {
          if (a.length !== b.length) return false
          for (var i = 0; i < a.length; i++) {
            if (identity(a[i]) !== identity(b[i])) return false
          }
          return true
        })
        .map(indexed => {
          const items = indexed.list
          const itemByKey = indexed.byKey
          items.forEach((item, idx) => {
            const key = identity(item)
            if (!cache.contains(key)) {
              const item$ = indexed$.map(i => i.byKey[key]).distinctUntilChanged().shareReplay(1)
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
  }

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
