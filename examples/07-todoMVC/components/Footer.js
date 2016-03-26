import { a, button, footer, li, span, strong, ul } from "@cycle/dom"
import { clearCompleted } from "../actions"

export function Footer({DOM, M}) {
  const intents = intent(DOM)
  const mod$ = M.lens("list").mod(intents.clearCompleted$.map(clearCompleted))

  return {
    M: mod$,
    DOM: view(M)
  }
}

function intent (DOM) {
  return {
    clearCompleted$: DOM.select(".clear-completed").events("click")
  }
}

function view (state$) {
  return state$.map(state => {
    let amountCompleted = state.list
      .filter(task => task.completed)
      .length
    let amountActive = state.list.length - amountCompleted

    return footer(".footer",
      { style: {"display": state.list.length ? "" : "none"} },
      [
        span(".todo-count", [
          strong(String(amountActive)),
          " item" + (amountActive !== 1 ? "s" : "") + " left"
        ]),
        ul(".filters", [
          li([
            a({
              attributes: {"href": "#/"},
              className: state.filter === "" ? ".selected" : ""
            }, "All")
          ]),
          li([
            a({
              attributes: {"href": "#/active"},
              className: state.filter === "active" ? ".selected" : ""
            }, "Active")
          ]),
          li([
            a({
              attributes: {"href": "#/completed"},
              className: state.filter === "completed" ? ".selected" : ""
            }, "Completed")
          ])
        ]),
        (amountCompleted > 0
          ? button(
              ".clear-completed",
              "Clear completed (" + amountCompleted + ")"
            )
          : null
        )
      ]
    )
  })
}

export default Footer
