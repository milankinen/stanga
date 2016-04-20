import { h1, header, input } from "@cycle/dom"
import { Observable as O } from "rx"
import { createTodo } from "../actions"
import { ENTER_KEY, ESC_KEY } from "../utils"

export function Header({DOM, M}) {
  const intents = intent(DOM)
  const mod$ = O.merge(
    M.lens("list").mod(intents.create$.map(createTodo))
  )

  return {
    M: mod$,
    DOM: O.merge(intents.reset$, intents.create$, O.just()).map(() =>
      header(".header", [
        h1("todos"),
        input(".new-todo", {
          type: "text",
          value: "",
          attributes: {placeholder: "What needs to be done?"},
          autofocus: true,
          name: "newTodo"
        })
      ]))
  }
}
export default Header

function intent(DOM) {
  const keydown$ = DOM.select(".new-todo").events("keydown").share()

  return {
    reset$: keydown$
      .filter(ev => ev.keyCode === ESC_KEY && trimmedValue(ev))
      .share(),

    create$: keydown$
      .filter(ev => ev.keyCode === ENTER_KEY && trimmedValue(ev))
      .map(ev => ({
        title: trimmedValue(ev)
      }))
      .share()
  }

  function trimmedValue(ev) {
    return String(ev.target.value).trim()
  }
}
