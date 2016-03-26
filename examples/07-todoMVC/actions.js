import { R } from "stanga"

export function toggleTodo () {
  return ({ ...todo }) => ({
    ...todo,
    completed: !todo.completed
  })
}
export function startTodoEdit () {
  return ({ ...todo }) => ({
    ...todo,
    editing: true
  })
}
export function cancelTodoEdit () {
  return ({ ...todo }) => ({
    ...todo,
    editing: false
  })
}
export function doneTodoEdit ({title}) {
  return ({ ...todo }) => ({
    ...todo,
    title,
    editing: false
  })
}
export function destroyFromList ({id}) {
  return (list) => list.filter(({id: _id}) => _id !== id)
}
export function changeFilter (route) {
  const filterFn = getFilterFn(route)
  return ({...model}) => ({
    ...model,
    filter: route.replace("/", "").trim(),
    filterFn
  })

  function getFilterFn(route) {
    switch (route) {
      case "/active": return (task => !task.completed)
      case "/completed": return (task => task.completed === true)
      default: return () => true // allow anything
    }
  }
}
export function createTodo({title}) {
  return (taskList) => {
    const biggestID = taskList.length > 0
      ? taskList.map(R.prop("id")).reduce(R.max)
      : 0

    const newTask = {
      id: biggestID + 1,
      title,
      completed: false
    }
    return [...taskList, newTask]
  }
}
export function toggleAll() {
  return (tasks) => {
    const allAreCompleted = tasks
      .every(({completed}) => completed)

    return tasks.map(({...task}) => ({
      ...task,
      completed: allAreCompleted ? false : true
    }))
  }
}
export function clearCompleted() {
  return (tasks) => tasks.filter(({completed}) => !completed)
}
