import {run} from "@cycle/core"
import {makeDOMDriver} from "cycle-snabbdom"
import {Model} from "stanga"

import CounterList, {nextId} from "./List"

run(CounterList, {
  DOM: makeDOMDriver("#app"),
  M: Model([
    {id: nextId(), val: 0},
    {id: nextId(), val: 1},
    {id: nextId(), val: 2},
    {id: nextId(), val: 3},
    {id: nextId(), val: 4}
  ])    // two counters initially
})
