import { run } from "@cycle/core"
import { Observable as O } from "rx"
import { makeDOMDriver, footer, div, p, section } from "@cycle/dom"
import storageDriver from "@cycle/storage"
import { Model } from "stanga"

import deserialize from "./storage-source"
import serialize from "./storage-sink"

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
    .map(() => window.location.hash.replace("#", "")), // eslint-disable-line no-undef
  storage: storageDriver
})

function main({DOM, M, hash, storage}) {
  const initialState$ = deserialize(storage.local
    .getItem("todos-cycle")
    .take(1)
    .shareReplay(1)
  )
  const storageSink$ = serialize(M)
    .map((state) => ({
      key: "todos-cycle",
      value: state
    }))


  const todos = Todos({DOM, M})
  const mod$ = O.merge(
    M.set(initialState$),
    M.mod(hash.map(changeFilter)),
    todos.M
  )

  return {
    M: mod$,
    storage: storageSink$,

    DOM: O.of(div([
      section(".todoapp", todos.DOM),
      footer(".info", [
        p("Double-click to edit a todo")
      ])
    ]),
  )}
}
