import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"
import R from "ramda"

import Calculator from "./Calculator"

function main({DOM, M}) {
  const out$ = M.map(C => C({DOM, M})).shareReplay(1)
  return {
    DOM: out$.map(R.prop("DOM")).switch(),
    M: out$.map(R.prop("M")).switch()
  }
}

run(main, {
  DOM: makeDOMDriver("#app"),
  M: Model(Calculator(0, R.identity))
})
