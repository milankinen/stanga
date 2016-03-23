import {Observable as O} from "rx"
import {run} from "@cycle/core"
import {makeDOMDriver, h} from "@cycle/dom"
import {Model} from "stanga"

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

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model(0)   // use initial value 0
})
