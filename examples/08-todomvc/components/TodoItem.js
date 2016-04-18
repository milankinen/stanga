import { Observable as O } from "rx"
import { button, div, input, label, li } from "@cycle/dom"
import { propHook, ENTER_KEY, ESC_KEY } from "../utils"
import { toggleTodo, startTodoEdit, cancelTodoEdit, doneTodoEdit, destroyFromList } from "../actions"


export function TodoItem({DOM, M, listM}) {
  const intents = intent(DOM, M)

  const mod$ = O.merge(
    M.mod(intents.toggleTodo$.map(toggleTodo)),
    M.mod(intents.startTodoEdit$.map(startTodoEdit)),
    M.mod(intents.cancelTodoEdit$.map(cancelTodoEdit)),
    M.mod(intents.doneTodoEdit$.map(doneTodoEdit)),
    listM.mod(intents.destroyFromList$.map(destroyFromList)),
  )

  return {
    M: mod$,
    DOM: view(M)
  }
}
export default TodoItem

function intent(DOM, state$) {
  return {
    toggleTodo$: DOM.select(".toggle")
      .events("change"),

    startTodoEdit$: DOM.select("label")
      .events("dblclick"),

    cancelTodoEdit$: DOM.select(".edit")
      .events("keyup")
      .filter(ev => ev.keyCode === ESC_KEY),

    doneTodoEdit$: DOM.select(".edit")
      .events("keyup")
      .filter(ev => ev.keyCode === ENTER_KEY)
      .merge(DOM.select(".edit").events("blur", true))
      .map(ev => ({title: ev.target.value})),

    destroyFromList$: DOM.select(".destroy")
      .events("click")
      .withLatestFrom(state$, (_, {id}) => ({id}))
  }
}

function view(state$) {
  return state$.map(({title, completed, editing, id}) => {
    const completedClass = (completed ? ".completed" : "")
    const editingClass = (editing ? ".editing" : "")
    return li(`.todoRoot${completedClass}${editingClass}`, {key: id}, [
      div(".view", [
        input(".toggle", {
          type: "checkbox",
          checked: completed
        }),
        label(title),
        button(".destroy")
      ]),
      input(".edit", {
        type: "text",
        value: propHook(element => {
          element.value = title
          if (editing) {
            element.focus()
            element.selectionStart = element.value.length
          }
        })
      })
    ])
  })
}
