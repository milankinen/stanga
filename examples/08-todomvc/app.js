import { run } from "@cycle/core"
import { Observable as O } from "rx"
import { footer, div, p, section } from "@cycle/dom"
import { Model } from "stanga"

import { changeFilter } from "./actions"
import Todos from "./components/Todos"


export default function main({DOM, M, hash}) {
  const todos = Todos({DOM, M})
  const mod$ = O.merge(
    M.mod(hash.map(changeFilter)),
    todos.M
  )

  return {
    M: mod$,
    DOM: todos.DOM.map(todos =>
      div([
        section(".todoapp", todos),
        footer(".info", [
          p("Double-click to edit a todo")
        ])
      ])).debounce(0)
  }
}
