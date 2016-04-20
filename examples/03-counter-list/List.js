import {Observable as O} from "rx"
import {h} from "@cycle/dom"
import isolate from "@cycle/isolate"
import {flatMerge, flatCombine} from "stanga"

import Counter from "../01-counter/Counter"

let ID = 0
export function nextId() {
  return ID++
}

export default function main({DOM, M}) {
  const counters$ = M
  const childSinks$ = counters$.liftListById((id, counter$) =>
    isolate(Counter, `counter-${id}`)({DOM, M: counter$.lens("val")}))

  const childVTrees$ = flatCombine(childSinks$, "DOM").DOM
  const childMods$ = flatMerge(childSinks$, "M").M

  const resetMod$ = DOM.select(".reset")
    .events("click")
    .map(() => counters => counters.map(c => ({...c, val: 0})))
  const appendMod$ = DOM.select(".add")
    .events("click")
    .map(() => counters => [...counters, {id: nextId(), val: 0}])

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
