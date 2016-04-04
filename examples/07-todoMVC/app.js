import { run } from "@cycle/core"
import { Observable as O } from "rx"
import { makeDOMDriver, footer, div, p, section } from "@cycle/dom"
import { Model } from "stanga"

import { changeFilter } from "./actions"
import Todos from "./components/Todos"

run(main, {
  M: Model({list: [
    {id: 3, title: "Cycle x Stanga <3"},
    {id: 2, title: "World !", completed: true},
    {id: 1, title: "Hello"}
  ], filterName: ""}),

  DOM: makeDOMDriver("#app"),
  hash: () => O.just("")
    .concat(O.fromEvent(window, "hashchange")) // eslint-disable-line no-undef
    .map(() => window.location.hash.replace("#", "")) // eslint-disable-line no-undef
})

function main({DOM, M, hash}) {


  const todos = Todos({DOM, M})
  const mod$ = O.merge(
    M.mod(hash.map(changeFilter)),
    todos.M
  )

  return {
    M: mod$,
    DOM: O.of(div([
      section(".todoapp", todos.DOM),
      footer(".info", [
        p("Double-click to edit a todo")
      ])
    ]),
  )}
}
