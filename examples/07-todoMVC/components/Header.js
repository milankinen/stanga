import { h1, header, input } from "@cycle/dom"
import { Observable as O } from "rx"
import { createTodo } from "../actions"
import { ENTER_KEY, ESC_KEY } from "../utils"

export function Header({DOM, M}) {
  const intents = intent(DOM)
  const mod$ = O.merge(
    M.lens("list").mod(intents.create$.map(createTodo)),
    M.lens("draft").set(O.merge(
      intents.update$.map(x => x),
      intents.create$.map(() => ""),
      intents.reset$.map(() => ""),
    ))
  )

  return {
    M: mod$,
    DOM: M.lens("draft").map(draft =>
      header(".header", [
        h1("todos"),
        input(".new-todo", {
          type: "text",
          value: draft,
          attributes: {placeholder: "What needs to be done?"},
          autofocus: true,
          name: "newTodo"
        })
      ])
    )
  }
}
export default Header

function intent (DOM) {
  const change$ = DOM.select(".new-todo")
    .events("change").share()
  const keydown$ = DOM.select(".new-todo")
    .events("keydown").share()

  return {
    reset$: keydown$
      .filter(ev => ev.keyCode === ESC_KEY && trimmedValue(ev)),

    update$: O.merge(keydown$, change$)
      .map(ev => String(ev.target.value)),

    create$: keydown$
      .filter(ev => ev.keyCode === ENTER_KEY && trimmedValue(ev))
      .map(ev => ({
        title: trimmedValue(ev)
      }))
  }

  function trimmedValue (ev) {
    return String(ev.target.value).trim()
  }
}
