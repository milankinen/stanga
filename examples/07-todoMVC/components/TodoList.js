import isolate from "@cycle/isolate"
import TodoItem from "./TodoItem"
import { liftListById, flatCombine, flatMerge, R, L } from "stanga"
import { ul } from "@cycle/dom"

export function TodoList ({ DOM, M }) {
  const liftTodoItem = (id, todoItem$) => {
    return isolate(TodoItem, `item-${id}`)({
      DOM,
      M: todoItem$,
      parentM: M.lens("list")
    })
  }

  let todoItems$ = M.flatMap(state =>
    liftListById(M.lens("list").lens(L.filter(state.filterFn)), liftTodoItem)
  )

  return {
    DOM: flatCombine(todoItems$, "DOM").DOM
      .map(R.reverse)
      .map(items => ul(".todo-list", items)),
    M: flatMerge(todoItems$, "M").M
  }
}
export default TodoList
