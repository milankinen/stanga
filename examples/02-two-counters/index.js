import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

import Counters from "./Counters"

run(Counters, {
  DOM: makeDOMDriver("#app"),
  M: Model({a: 0, b: 0})   // use initial value 0 for both "a" and "b" counters
})
