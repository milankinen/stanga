import {run} from "@cycle/core"
import {makeDOMDriver} from "@cycle/dom"
import {Model} from "stanga"

import Form from "./Form"


run(Form, {
  DOM: makeDOMDriver("#app"),
  M: Model({}),
  alert: alert$ => alert$.subscribe(text => alert(text))
})
