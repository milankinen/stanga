import { run } from "@cycle/core"
import { makeDOMDriver, footer, div, p, section } from "@cycle/dom"
import { Observable as O } from "rx"
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
  ], filter: "", filterFn: () => {}}),

  DOM: makeDOMDriver("#app"),
  initialHash: () => O.just(window.location.hash), // eslint-disable-line no-undef
  hashchange: () => O.fromEvent(window, "hashchange"), // eslint-disable-line no-undef
  storage: storageDriver
})

function main({DOM, M, hashchange, initialHash, storage}) {
  const intents = intent({ hashchange, initialHash })
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
    M.mod(intents.routeChange$.map(changeFilter)),
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

function intent ({ hashchange, initialHash }) {
  return {
    routeChange$: O.concat(
        initialHash.map(hash => hash.replace("#", "")),
        hashchange.map(ev => ev.newURL.match(/\#[^\#]*$/)[0].replace("#", ""))
      )
      .startWith("/")
  }
}
