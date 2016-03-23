# Stanga

The essential Cycling gear every Cyclist needs. Crafted with care. For easier rides.

[![Travis Build](https://img.shields.io/travis/milankinen/stanga/master.svg?style=flat-square)](https://travis-ci.org/milankinen/stanga)
[![Code Coverage](https://img.shields.io/codecov/c/github/milankinen/stanga/master.svg?style=flat-square)](https://codecov.io/github/milankinen/stanga)
[![NPM version](https://img.shields.io/npm/v/stanga.svg?style=flat-square)](https://www.npmjs.com/package/stanga)
[![GitHub issues](https://img.shields.io/badge/issues-stanga-blue.svg?style=flat-square)](https://github.com/milankinen/stanga/issues)

## Motivation

**[Cycle.js](http://cycle.js.org)** does great job when the application is simple. However,
when the application complexity grows, trivial things become non-trivial very quickly.
The tutorials and examples don't have any common patterns or best practices to deal with
these complex situations and developers are by their own.

This library aims to give some tried-and-tests, "battle-proven" functions and utilities 
to solve these problems so that you can build your complex Cycle application faster and easier.

The origin of these utilities comes from **[CALM^2](https://github.com/calmm-js)**, but
they're applicable to Cycle codebase easily (with minor modifications) because the 
architecture designs are some close to each other. Thanks to 
**[Vesa](https://twitter.com/VesaKarvonen)** who is the main inventor of these patterns.

## Tutorial

**OBS!** If you are searching for API reference, please see below.

### Placing the state to `Model` driver and reading it

If you're already familiar with [cycle-examples](https://github.com/cyclejs/examples) this
section may confuse you. Traditionally in Cycle, the application state lives inside the
`main` so that **i**ntents (like clicks) modify the state (= **m**odel) and the modified
state is passed to the **v**iew that produces you a stream of virtual dom `vdom$`.

With `stanga`, you move your state from `main` to `Model` driver. You can give the initial
state to the driver during the driver initialization.

```javascript
import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model(0)     // initial state = 0
})
``` 

Now the state lives in model driver `M` which is just an observable that you can use
like any other observable in Cycle:

```javascript
function main({DOM, M}) {
  const state$ = M
  return {
    DOM: state$.map(counter => h("h1", `Counter value is ${counter}`))
  }
}
```

Not bad, huh? Let's go forward!

### Modifying the state 

Now you know how to read the state. Let's take a look how to modify it. Like in Cycle's docs,
write effects go to sinks - and `Model` driver is not an exception. You may've faced `mod$`
streams when looking at Cycle's examples. `mod$` is a stream of functions `currentState => newState`,
that does the actual state modification. Those are the way to modify the `Model` driver's state too.
 
`Model` driver's source provides a `.mod` in order to "convert" those modifications into 
format that driver understands. Let's make the counter editable!

```javascript
import {Observable as O} from "rx"

function main({DOM, M}) {
  const state$ = M
  const incMod$ = DOM.select(".inc")
    .events("click")
    .map(() => state => state + 1)
  const decMod$ = DOM.select(".dec")
    .events("click")
    .map(() => state => state - 1)
  
  // let's merge all mods from this component
  const mod$ = O.merge(incMod$, decMod$)
  
  const vdom$ = state$.map(counter => h("div", [
    h("h1", `Counter value is ${counter}`),
    h("button.inc", "++"),
    h("button.dec", "--")
  ]))
  
  return {
    DOM: vdom$,
    // and make the compatible with Model driver
    M: M.mod(mod$)
  }
}
``` 

Okay that looks very similar to Cycle's examples. But there is no (direct) connection
between intents (`mod$`) and `state$`?! That's right, the connection is made inside
the driver - driver changes the state based on the mods and emits the changed state
back to the component via `state$` stream. If you've used `HTTP` driver, the behaviour 
is **exactly same**. Got it?

If you want to completely override the state, Model driver provides `.set` method,
which takes a stream of values (instead of mod functions!) and resets the state by
using those values (i.e. shorthand to `M.mod(value$.map(value => () => value))`).

### Getting some sub-state by using lenses

Nothing new? All of that could've done by using "traditional" Cycle approach, you
might think. Yes, true. But let's go forward. How about if you must have two counters,
print their total value and provide a way to reset both counters at once?

In the "traditional" approach, the solution might look something like 
[this](https://gist.github.com/milankinen/cb0e898ae52c61e8d5da)... Whoah! That's
a lot of stuff with things like proxy subjects stream switching, skipping and
concatenation. Let's take a look how one would build the same app with 
`stanga`'s model driver!

Model driver source has `.lens(Lens)` method that uses internally 
[partial.lenses](https://github.com/calmm-js/partial.lenses). In order to understand,
lenses better, you have to take a look at `partial.lenses` docs. For you can just
treat them like property getter `const a = M.lens("a")` where `a` is a model driver
(containing exactly same methods `.mod`, `.set` and `.lens`) **BUT** so that it uses
the original state's property `.a` - it's a stream that emits the changes only when
property `a` changes. And modifications with `a.mod(mod$)` change only `a`'s state!

Let's see how it looks like in the counter example:
```javascript 
function Counter({DOM, M}) {
  // NO CHANGES TO THE EXISTING CODE!
}

function main({DOM, M}) {
  const state$ = M
  const a$ = state$.lens("a")
  const b$ = state$.lens("b")
  // we can use "lensed" a$ and b$ as a driver for child components
  const a = isolate(Counter)({DOM, M: a$})
  const b = isolate(Counter)({DOM, M: b$})

  const resetMod$ = DOM.select(".reset").events("click").map(() => () => ({a: 0, b: 0}))
  const aMod$ = a.M
  const bMod$ = b.M

  const vdom$ = O.combineLatest(state$, a.DOM, b.DOM, (state, a, b) =>
    h("div", [
      a, b,
      h("hr"),
      h("h2", `Total: ${state.a + state.b}`),
      h("button.reset", "Reset")
    ]))
  
  return {
    DOM: vdom$,
    // a.M and b.M are already converted to Model driver's mods
    // in Counter component so we can merge them to parent's mods
    // directly
    M: O.merge(M.mod(resetMod$), aMod$, bMod$)
  }
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model({a: 0, b: 0})
})
```

As you can see, there is **no modifications** to the original `Counter` component!
And no switching, proxying or other "advanced" stuff. In the end, the problem is 
not advanced - just some simple stream processing!

Note that you can pass lensed sub-states directly to sub-component as a model driver
and merge the modification sinks to parent's modifications like any like you'd merge
any other stream. *And this is the core pattern of `stanga` that gets repeated 
everywhere.* Once you get it, you'll be able to create complex apps like they were
as simple as the previous counter app.

### Processing list states by using lenses (again)

#### Lifting list observable to observable of sinks

Lists are a little bit more complicated thing. If you don't believe, just take a
look at cycle's advanced list example! ...just kidding! With `stanga`, list processing
is *almost*  as easy as processing props. 

What is "list state"? It's an observable emitting events that contain arrays 
with arbitrary number of items. If those items have an **unique key** (e.g. `id`),
`stanga` provides `liftListById`, `flatCombine` and `flatMerge` that make the
list processing extremely easy.

`liftListById` is most powerful of those functions - it conceals many performance
optimizations, caching, cold->hot observable conversions and event replaying that
you'd normally need to do yourself. Now all you need is just an `id` in your list
items! Conceptually `liftListById` is almost like 
```javascript 
const liftListById = fn => list$.map(items => items.map(item => fn(item.id, item)))
``` 

The transformer function that is passed to `liftListById` should invoke some (child)
component function and return the sinks from the child component. The transformer
function receives item id as a first parameter and if you are lifting model
(returned by e.g. `M.lens("items")`), the function receives also second parameter
which is the *lensed item state*. 

The code is far more simpler than the explanation:
```javascript
import {liftListById} from "stanga"

let ID = 0

function main({DOM, M}) {
  const counters$ = M
  const childSinks$ = liftListById(counters$, (id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))
  // ...
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model([{id: ID++, val: 0}, {id: ID++, val: 0}])    // two counters initially
})
```

Note that `counter$` is a model (containing model's state observable) that
can be passed to child component directly. `Counter` component expects the
model to be an integer (counter's value) so we need to get the value by
using lens (should be nothing new here, huh?).

#### Extracting values from the lifted sinks

Well.. now you have an observable that emits events of list of sinks and you
should "extract" values from those child sinks somehow. Basically there are
two different kind of strategies: combining and merging. 

In combine strategy, you pick some of the sinks and combine their latest 
values by using `Observable.combineLatest`. As a result, you get a list 
observable containing the latest values from child sinks. Usually you want
to apply this extraction strategy to `DOM` sinks so that you get a nice
array of child virtual-dom trees that you can post-process in your parent
component (maybe add more virtual-dom around children?).

To use the combine strategy, import `flatCombine` from `stanga` and define
the sinks you want to "extract and combine" - the returned value is an
"sink-like" object containing the extracted sinks as keys and their list 
observables as values. Again, the actual code is simpler than the explanation:
```javascript
function main({DOM, M}) {
  const counters$ = M
  const childSinks$ = liftListById(counters$, (id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))
  // you can also extract multiple keys, e.g. flatCombine(childSinks$, "DOM", "foo", "bar")
  const children = flatCombine(childSinks$, "DOM")
  // extracted children.DOM is now a normal observable containing an array of 
  // children vtrees
  const vdom$ = children.DOM.map(childVTrees =>
    h("ul", childVTrees.map(child => h("li", [child]))))
  ...
}
``` 

Merge strategy behaves almost like combine strategy but instead of combining
an array from child sinks, the child sinks are *merged* by using 
`Observable.merge`. This is ideal for sinks containing actions (like 
`HTTP` requests or `M` mods):
```javascript
function main({DOM, M}) {
  const counters$ = M
  const childSinks$ = liftListById(counters$, (id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))
  const vdom$ = ...  
  const childSinks = flatMerge(childSinks$, "M")
  return {
    DOM: vdom$,
    M: childSinks.M 
  }
}
```

Let's combine those and create the "counter list" component:
```javascript
let ID = 0

function Counter({DOM, M}) {
  // NOT CHANGED!
}

function main({DOM, M}) {
  const counters$ = M
  const childSinks$ = liftListById(counters$, (id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))
  
  const childVTrees$ = flatCombine(childSinks$, "DOM").DOM
  const childMods$ = flatMerge(childSinks$, "M").M 
  
  const resetMod$ = DOM.select(".reset").events("click")
    .map(() => counters => counters.map(c => ({...c, val: 0})))
  const appendMod$ = DOM.select(".add").events("click")
    .map(() => counters => [...counters, {id: ID++, val: 0}])
  
  const vdom$ = O.combineLatest(counters$, childVTrees$, (counters, children) =>
    h("div", [
      h("ul", children.map(child => h("li", [child]))),
      h("hr"),
      h("h2", `Avg: ${avg(counters.map(c => c.val)).toFixed(2)}`),
      h("button.reset", "Reset"),
      h("button.add", "Add counter")
    ]))

  return {
    DOM: vdom$,
    M: O.merge(M.mod(resetMod$), M.mod(appendMod$), childMods$)
  }
}

function avg(list) {
  return list.length ? list.reduce((x, y) => x + y, 0) / list.length : 0
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model([{id: ID++, val: 0}, {id: ID++, val: 0}])    // two counters initially
})
```

Congrats! Now you know how to create complex apps with Cycle and `stanga`. 
The rest is just composing and combining the basic cases we just covered. If 
you didn't get it now, don't worry - read this tutorial again (and again) and
take a look at the examples. It might take some time to learn this all new 
stuff like lenses and modifications but it's definitely worth it!

### DRYing the sinks

TODO... `mergeByKeys` 

### Advanced: playing with lenses

TODO... `L.default` `L.augment`


## API Reference

TODO...


## License

MIT

