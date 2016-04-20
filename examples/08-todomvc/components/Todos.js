import { Observable as O } from "rx"
import { input, section, div } from "@cycle/dom"
import Header from "./Header"
import TodoList from "./TodoList"
import Footer from "./Footer"
import { toggleAll } from "../actions"
import { L, R } from "stanga"
import { getFilterFn } from "../utils"

function Todos({DOM, M}) {

  const filteredList$ = M.lens(L.props("filterName", "list")).lens(L.lens(
    ({list, filterName}) => list.filter(getFilterFn(filterName)),
    (list, model) => ({...model, list})
  ))
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

  const styleDOM$ = M.map(({list}) => ({style: {"display": list.length ? "" : "none"}}))
  const toggleDOM$ = M.map(({list}) =>
    input(".toggle-all", {
      type: "checkbox",
      checked: list.every(R.prop("completed"))
    }))

  return {
    M: mod$,
    DOM: O.combineLatest(header.DOM, styleDOM$, toggleDOM$, todoList.DOM, footer.DOM,
      (header, style, toggle, list, footer) =>
        div([
          header,
          section(
            ".main",
            style,
            [
              toggle,
              list
            ]
          ),
          footer
        ]))
  }
}

export default Todos

function intent({DOM}) {
  return {
    toggleAll$: DOM.select(".toggle-all").events("change")
  }
}
