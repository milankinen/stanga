import { Observable as O } from "rx"
import { input, section, div } from "@cycle/dom"
import Header from "./Header"
import TodoList from "./TodoList"
import Footer from "./Footer"
import { toggleAll } from "../actions"

function Todos({DOM, M}) {
  const todoList = TodoList({DOM, M})
  const header = Header({DOM, M})
  const footer = Footer({DOM, M})

  const intents = intent(DOM)
  const mod$ = M.lens("list").mod(intents.toggleAll$.map(toggleAll))

  return {
    DOM: O.combineLatest(
      M.lens("list"),
      todoList.DOM,
      (list, todoListDOM) =>
        div([
          header.DOM,
          renderMainSection(list, [todoListDOM]),
          footer.DOM
        ])
    ),
    M: O.merge(header.M, todoList.M, footer.M, mod$)
  }
}

export default Todos

function intent (DOM) {
  return {
    toggleAll$: DOM.select(".toggle-all").events("change")
  }
}

function renderMainSection(state, children) {
  let allCompleted = state.every(task => task.completed)
  return section(
    ".main",
    { style: {"display": state.length ? "" : "none"} },
    [
      input(".toggle-all", {
        type: "checkbox",
        checked: allCompleted
      }),
      ...children
    ]
  )
}
