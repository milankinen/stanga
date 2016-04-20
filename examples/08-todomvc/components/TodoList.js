import isolate from "@cycle/isolate"
import TodoItem from "./TodoItem"
import { flatCombine, flatMerge, R } from "stanga"
import { ul } from "@cycle/dom"

export function TodoList ({ DOM, M }) {
  const todoItems$ = M.liftListById((id, todoItem$) => {
    const isolatedTodoItem = isolate(TodoItem, `item-${id}`)

    return isolatedTodoItem({DOM, M: todoItem$, listM: M})
  })

  return {
    M: flatMerge(todoItems$, "M").M,
    DOM: flatCombine(todoItems$, "DOM").DOM
      .map(R.reverse)
      .map(items => ul(".todo-list", items))
  }
}
export default TodoList
