import { Observable as O } from "rx"
import { run } from "@cycle/core"
import { makeDOMDriver } from "@cycle/dom"
import { Model } from "stanga"

import TodoMVC from "./App"


const head = document.getElementsByTagName("head")[0]
const cssUrls = [
  "node_modules/todomvc-common/base.css",
  "node_modules/todomvc-app-css/index.css"
]

cssUrls
  .map(createStyleSheet)
  .forEach(head.appendChild.bind(head))


const initialState = {
  list: [
    {id: 3, title: "Cycle x Stanga <3"},
    {id: 2, title: "World !", completed: true},
    {id: 1, title: "Hello"}
  ],
  filterName: ""
}

run(TodoMVC, {
  M: Model(initialState),
  DOM: makeDOMDriver("#app"),
  hash: () =>
    O.fromEvent(window, "hashchange")
      .map(windowHash)
      .startWith(windowHash())
})

function windowHash() {
  return window.location.hash.replace("#", "")
}

function createStyleSheet(url) {
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = url
  link.media = "all"
  return link
}
