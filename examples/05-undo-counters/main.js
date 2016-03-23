import {Observable as O} from "rx"
import {run} from "@cycle/core"
import {makeDOMDriver, h} from "@cycle/dom"
import isolate from "@cycle/isolate"
import {Model, liftListById, flatMerge, flatCombine} from "stanga"
import R from "ramda"

import Counter from "./Counter"
import undoable from "./undoable"

let ID = 0

function main({DOM, M}) {
  const {value$: counters$, canUndo$, canRedo$, mods: {undo$, redo$}} = undoable(M)

  const childSinks$ = liftListById(counters$, (id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))

  const childVTrees$ = flatCombine(childSinks$, "DOM").DOM
  const childMods$ = flatMerge(childSinks$, "M").M

  const resetMod$ = DOM.select(".reset").events("click")
    .map(() => counters => counters.map(c => ({...c, val: 0})))
  const appendMod$ = DOM.select(".add").events("click")
    .map(() => counters => [...counters, {id: ID++, val: 0}])
  const undoMod$ = undo$.sample(DOM.select(".undo").events("click")).do(x => console.log("undo"))
  const redoMod$ = redo$.sample(DOM.select(".redo").events("click")).do(x => console.log("redo"))

  const vdom$ = O.combineLatest(counters$, canUndo$, canRedo$, childVTrees$,
    (counters, canUndo, canRedo, children) =>
      h("div", [
        h("ul", children.map(child => h("li", [child]))),
        h("hr"),
        h("h2", `Avg: ${avg(counters.map(c => c.val)).toFixed(2)}`),
        h("button.reset", "Reset"),
        h("button.add", "Add counter"),
        h("button.undo", {disabled: !canUndo}, "Undo"),
        h("button.redo", {disabled: !canRedo}, "Redo")
      ]))

  return {
    DOM: vdom$,
    M: O.merge(counters$.mod(O.merge(resetMod$, appendMod$)), undoMod$, redoMod$, childMods$)
  }
}

function avg(list) {
  return list.length ? list.reduce((x, y) => x + y, 0) / list.length : 0
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model([{id: ID++, val: 0}, {id: ID++, val: 0}], {logging: true})    // two counters initially
})
