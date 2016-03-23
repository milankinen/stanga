import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

import UndoableList from "./List"
import {nextId} from "../03-counter-list/List"

run(UndoableList, {
  DOM: makeDOMDriver("#app"),
  M: Model([{id: nextId(), val: 0}])    // one counter initially
})
