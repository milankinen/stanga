// Turn the data object that contains
// the todos into a string for localStorage.
export default function serialize(todos$) {
  return todos$.map(({ list, draft }) => JSON.stringify(
    {
      list: list.map(({ title, completed, id }) =>
        ({
          title,
          completed,
          id
        })
      ),
      draft
    }
  ))
}
