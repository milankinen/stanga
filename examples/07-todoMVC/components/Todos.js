import { Observable as O } from "rx"
import { input, section, div } from "@cycle/dom"
import Header from "./Header"
import TodoList from "./TodoList"
import Footer from "./Footer"
import { toggleAll } from "../actions"
import { L, R } from "stanga"
import { getFilterFn } from "../utils"

function Todos({DOM, M}) {

  const filteredList$ = M.lens(L.lens(
    model => ({
      ...model,
      list: model.list.filter(getFilterFn(model.filterName))
    }),
    R.identity // the setter method is needed so that we can update the list later
  )).lens("list")
  const todoList = TodoList({DOM, M: filteredList$})

  const header = Header({DOM, M: M.lens(L.props("draft", "list"))})
  const footer = Footer({DOM, M: M.lens(L.props("filterName", "list"))})

  const intents = intent({DOM})
  const mod$ = O.merge(
    M.lens("list").mod(intents.toggleAll$.map(toggleAll)),
    header.M,
    todoList.M,
    footer.M
  )
  const state$ = M.lens(L.augment({
    allCompleted: ({list}) => list.every(R.prop("completed"))
  }))

  return {
    M: mod$,
    DOM: state$.map(({list, allCompleted}) =>
      div([
        header.DOM,
        section(
          ".main",
          { style: {"display": list.length ? "" : "none"} },
          [
            input(".toggle-all", {
              type: "checkbox",
              checked: allCompleted
            }),
            todoList.DOM
          ]
        ),
        footer.DOM
      ])
    )
  }
}

export default Todos

function intent ({DOM}) {
  return {
    toggleAll$: DOM.select(".toggle-all").events("change")
  }
}
