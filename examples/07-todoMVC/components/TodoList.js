import isolate from "@cycle/isolate"
import TodoItem from "./TodoItem"
import { liftListById, flatCombine, flatMerge, R, L } from "stanga"
import { ul } from "@cycle/dom"
import { getFilterFn } from "../utils"

export function TodoList ({ DOM, M }) {
  const liftTodoItem = (id, todoItem$) => {
    return isolate(TodoItem, `item-${id}`)({
      DOM,
      M: todoItem$,
      listM: M.lens("list")
    })
  }

  const todoItems$ = M.flatMapLatest(({filterName}) => liftListById(
    M.lens("list").lens(L.filter(getFilterFn(filterName))),
    liftTodoItem
  )).shareReplay(1)

  return {
    M: flatMerge(todoItems$, "M").M,
    DOM: flatCombine(todoItems$, "DOM").DOM
      .map(R.reverse)
      .map(items => ul(".todo-list", items))
  }
}
export default TodoList
