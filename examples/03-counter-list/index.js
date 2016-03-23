import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

import CounterList, {nextId} from "./List"

run(CounterList, {
  DOM: makeDOMDriver("#app"),
  M: Model([{id: nextId(), val: 0}, {id: nextId(), val: 0}])    // two counters initially
})
