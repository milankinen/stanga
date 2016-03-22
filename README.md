# Stanga

The essential Cycling gear that every Cyclist needs - for faster rides.

[![Travis Build](https://img.shields.io/travis/milankinen/stanga/master.svg?style=flat-square)](https://travis-ci.org/milankinen/stanga)
[![Code Coverage](https://img.shields.io/codecov/c/github/milankinen/stanga/master.svg?style=flat-square)](https://codecov.io/github/milankinen/stanga)
[![NPM version](https://img.shields.io/npm/v/stanga.svg?style=flat-square)](https://www.npmjs.com/package/stanga)
[![GitHub issues](https://img.shields.io/badge/issues-stanga-blue.svg?style=flat-square)](https://github.com/milankinen/stanga/issues)

## Motivation

TODO

## Usage

### Installation

`stanga` is available for CommonJS compatible bundlers via [npm](https://www.npmjs.com/package/stanga):
```
npm i --save stanga
```

### API reference

#### `Model`

TODO

#### `mergeKeys :: (...sinks) => sink`

Merges streams per key from the given list of sink objects (objects of streams). 
Result sink contains all keys that appear in any of the given sinks.
```javascript
import {mergeKeys} from "stanga"

const aSinks = Counter(sources)           // aSink: {DOM, HTTP}
const bSinks = Counter(sources)           // bSink: {DOM, HTTP}
const cSink  = List(sources)              // cSink: {DOM, items$}
const sinks = mergeKeys(aSinks, bSinks)   // sinks: {DOM, HTTP, items$}
```


#### `muxListById :: (list$, (id => sinks)) => sink$`

This function is almost `list$.map(...)` but bumped with steroids. It's meant to
render sub-applications for list items with heavy performance optimization.

`list$` is an observable of list where every item have an unique `.id` property.
`(id => sinks)` is a mapper function that creates a component for the item and
returns its sinks. This mapper function is called **only once** for the added
items. When item is removed, its sinks are disposed.

This function is an excellent match with `Model` driver.

```javascript
import R from "ramda"
import {L, muxListById} from "stanga"
import Item from "./Item"

function main(sources) {
  const items$ = sources.M.lens("items")
  const children$$ = muxListById(items$, id => {
    const item$ = items$.lens(L.find(R.whereEq({id})))
    return Item({...sources, M: item$})
  })
}
```

By default, only `DOM` sinks are replayed. If you have other sinks that produce
value(s) **immediately** after subscription, you can define also them to be replayed
by giving a list of replayed sinks as a third parameter (this is for advanced users
only, normally "intent-only" sinks like HTTP should not need replaying).

```javascript
import R from "ramda"
import {L, muxListById} from "stanga"
import Item from "./Item"

function main(sources) {
  const items$ = sources.M.lens("items")
  const replayedSinks = ["DOM", "myCustomSink"]
  const children$$ = muxListById(items$, id => {
    const item$ = items$.lens(L.find(R.whereEq({id})))
    return Item({...sources, M: item$})
  }, replayedSinks)
}
```

#### `demuxAndCombine :: (sinks$$, ...keys) => sinks`

This function is an easy way to combine get latest values from specific child sinks as
an array. Usually you want to use this for `DOM` sinks after `muxListById`.

```javascript
import R from "ramda"
import {L, muxListById} from "stanga"
import Item from "./Item"

function main(sources) {
  const items$ = sources.M.lens("items")
  const children$$ = muxListById(items$, id => ...same as above...)
  const children = demuxAndCombine(children$$, "DOM")
  // children.DOM values are arrays containing latest values from children DOM sinks 
  // (like from Observable.combineLatest)
  const vtree$ = children.DOM.map(itemVtrees => h("ul#my-list", itemVtrees))
  return { DOM: vtree$ }
}
```

#### `demuxAndMerge :: (sinks$$, ...keys) => sinks`

Same as `demuxAndCombine` but uses `Observable.merge` to combine child sinks instead of 
`Observable.combineLatest`. Usually you want to use this for "intent-only" sinks where
you just want to return an Observable of values (like HTTP)

```javascript
import R from "ramda"
import {L, muxListById} from "stanga"
import Item from "./Item"

function main(sources) {
  const items$ = sources.M.lens("items")
  const children$$ = muxListById(items$, id => ...same as above...)
  const children = demuxAndMerge(children$$, "HTTP")
  return {
    HTTP: children.HTTP
  }
}
```




## License

MIT

