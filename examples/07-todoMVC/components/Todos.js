import { Observable as O } from "rx"
import { input, section, div } from "@cycle/dom"
import Header from "./Header"
import TodoList from "./TodoList"
import Footer from "./Footer"
import { toggleAll } from "../actions"
import { L, R } from "stanga"

function Todos({DOM, M}) {
  const state$ = M.lens(L.augment({
    allCompleted: ({list}) => list.every(R.prop("completed"))
  }))

  const todoList = TodoList({DOM, M: M.lens(L.props("filterName", "list"))})
  const header = Header({DOM, M: M.lens(L.props("draft", "list"))})
  const footer = Footer({DOM, M: M.lens(L.props("filterName", "list"))})

  const intents = intent({DOM})
  const mod$ = M.lens("list").mod(intents.toggleAll$.map(toggleAll))

  return {
    DOM: state$.map(state =>
      div([
        header.DOM,
        renderMainSection(state, [todoList.DOM]),
        footer.DOM
      ])
    ),
    M: O.merge(header.M, todoList.M, footer.M, mod$)
  }
}

export default Todos

function intent ({DOM}) {
  return {
    toggleAll$: DOM.select(".toggle-all").events("change")
  }
}

function renderMainSection({list, allCompleted}, children) {
  return section(
    ".main",
    { style: {"display": list.length ? "" : "none"} },
    [
      input(".toggle-all", {
        type: "checkbox",
        checked: allCompleted
      }),
      ...children
    ]
  )
}
