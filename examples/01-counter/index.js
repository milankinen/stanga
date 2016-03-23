import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

import Counter from "./Counter"

run(Counter, {
  DOM: makeDOMDriver("#app"),
  M: Model(0)   // use initial value 0
})
