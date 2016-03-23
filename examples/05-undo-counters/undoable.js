import {L} from "stanga"
import R from "ramda"

export default function makeUndoable(state$, maxRevs = 10) {
  const Undoable = UndoableWithMaxRevs(maxRevs)
  const undoable$ = state$.lens(L.lens(
    s => s instanceof Undoable ? s : new Undoable([s]),
    next => next
  ))

  return {
    value$: undoable$.lens(L.lens(s => s.get(), (a, s) => a instanceof Undoable ? a : (s instanceof Undoable ? s.update(a) : new Undoable([s, a])))),
    canUndo$: undoable$.map(s => s.canUndo()),
    canRedo$: undoable$.map(s => s.canRedo()),
    mods: {
      undo$: undoable$.mod(undoable$.map(s => s.undoMod())).share(),
      redo$: undoable$.mod(undoable$.map(s => s.redoMod())).share()
    }
  }
}

const UndoableWithMaxRevs = maxRevs => class Undoable {
  constructor(revs, cursor = 0) {
    this.revs = revs
    this.cursor = cursor
  }
  get() {
    return this.revs[this.revs.length - this.cursor - 1]
  }
  update(next) {
    return this.cursor === 0 ? new Undoable(R.takeLast(maxRevs, [...this.revs, next]))
      : new Undoable([...R.take(this.revs.length - this.cursor, this.revs), next])
  }
  undoMod() {
    return () => new Undoable(this.revs, Math.min(this.revs.length - 1, this.cursor + 1))
  }
  redoMod() {
    return () => new Undoable(this.revs, Math.max(0, this.cursor - 1))
  }
  canUndo() {
    return this.cursor < this.revs.length - 1
  }
  canRedo() {
    return this.cursor > 0
  }
}
