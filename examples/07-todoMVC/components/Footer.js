import { a, button, footer, li, span, strong, ul } from "@cycle/dom"
import { clearCompleted } from "../actions"
import { R, L } from "stanga"

export function Footer({DOM, M}) {
  const state$ = M.lens(L.compose(
    L.augment({
      amountCompleted: ({list}) => list
        .filter(R.prop("completed"))
        .length
    }),
    L.augment({
      amountActive: ({list, amountCompleted}) => list.length - amountCompleted
    })
  ))
  const intents = intent(DOM)
  const mod$ = M.lens("list").mod(intents.clearCompleted$.map(clearCompleted))

  return {
    M: mod$,
    DOM: view(state$)
  }
}

function intent (DOM) {
  return {
    clearCompleted$: DOM.select(".clear-completed").events("click")
  }
}

function view (state$) {
  return state$.map(({list, filterName, amountCompleted, amountActive}) => {
    return footer(".footer",
      { style: {"display": list.length ? "" : "none"} },
      [
        span(".todo-count", [
          strong(String(amountActive)),
          " item" + (amountActive !== 1 ? "s" : "") + " left"
        ]),
        ul(".filters", [
          li([
            a({
              attributes: {"href": "#/"},
              className: (!filterName) ? "selected" : ""
            }, "All")
          ]),
          li([
            a({
              attributes: {"href": "#/active"},
              className: (filterName === "active") ? "selected" : ""
            }, "Active")
          ]),
          li([
            a({
              attributes: {"href": "#/completed"},
              className: (filterName === "completed") ? "selected" : ""
            }, "Completed")
          ])
        ]),
        (amountCompleted > 0)
          ? button(
              ".clear-completed",
              "Clear completed (" + amountCompleted + ")"
            )
          : null
      ]
    )
  })
}

export default Footer
