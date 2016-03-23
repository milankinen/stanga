import "should"
import Rx, {Observable as O} from "rx"
import R from "ramda"
import {liftListById, Model} from "../src/index"

const keys = x => x ? Object.keys(x) : []

describe("liftListById", () => {
  it("create item sub-streams only once", done => {
    const list$ = O.of([{id: 1}], [{id: 1}], [{id: 1}, {id: 2}])
    liftListById(list$, id => ({A: O.just(id)}))
      .bufferWithTime(100)
      .first()
      .subscribe(
        xs => xs.map(x => x.map(keys)).should.deepEqual([[["A"]], [["A"], ["A"]]]),
        done.fail,
        done
      )
  })

  it("allows re-indexing items without re-creating sub-streams", done => {
    const list$ = O.of([{id: 1}, {id: 2}], [{id: 1}, {id: 2}])
    liftListById(list$, id => ({A: O.just(id)}))
      .bufferWithTime(100)
      .first()
      .subscribe(
        xs => xs.map(x => x.map(keys)).should.deepEqual([[["A"], ["A"]]]),
        done.fail,
        done
      )
  })

  it("removes sub-streams when item is removed from the list", done => {
    const list$ = O.of([{id: 1}], [])
    liftListById(list$, id => ({A: O.just(id)}))
      .bufferWithTime(100)
      .first()
      .subscribe(
        xs => xs.map(x => x.map(keys)).should.deepEqual([[["A"]], []]),
        done.fail,
        done
      )
  })

  it("disposes sub-streams when item is removed", done => {
    const list$ = O.of([{id: 1}], []).merge(O.never())
    liftListById(list$,
      id => ({
        A: O.just(id).finally(() => {
          setTimeout(done, 100)
        })
      }))
      .bufferWithTime(50)
      .first()
      .subscribe(
        xs => xs.map(x => x.map(keys)).should.deepEqual([[["A"]], []]),
        done.fail
      )
  })

  it("makes inner streams hot", done => {
    const list$ = O.of([{id: 1}])
    liftListById(list$, id => ({A: O.just(id).do(() => done())}))
      .subscribe(() => null, done.fail)
  })

  it("disposes all sub-streams when the mapped list stream is disposed", done => {
    const s = new Rx.Subject()
    const list$ = O.of([{id: 1}, {id: 2}])
    const list$$ = O.just(list$).merge(O.just(O.never()).delay(10))

    s.bufferWithCount(2).subscribe(ids => {
      ids.should.deepEqual([1, 2])
      done()
    })
    list$$.flatMapLatest(list$ => liftListById(list$, id => ({
        A: O.just(id).finally(() => s.onNext(id))
      })))
      .subscribe(() => null, done.fail)
  })


  it("creates a lensed sub-state from the items if lifting model", done => {
    const mod$ = new Rx.ReplaySubject(4)
    const list$ = Model([{id: 1, msg: "tsers"}])(mod$)
    O.merge(
      list$.set(O.just([{id: 1, msg: "foo"}, {id: 2, msg: "foo"}])).delay(1),
      list$.set(O.just([{id: 1, msg: "bar"}, {id: 2, msg: "foo"}])).delay(2),
      list$.set(O.just([{id: 1, msg: "bar"}, {id: 2, msg: "bar"}])).delay(3),
      list$.set(O.just([{id: 2, msg: "tsers"}])).delay(4)
    ).subscribe(mod$)

    liftListById(list$, (_, item$) => ({m: item$.lens("msg")}))
      .map(R.pluck("m"))
      .flatMapLatest(O.combineLatest)
      .bufferWithTime(100)
      .first()
      .subscribe(
        xs => xs.should.deepEqual([
          ["tsers"],
          ["foo", "foo"],
          ["bar", "foo"],
          ["bar", "bar"],
          ["tsers"]
        ]),
        done.fail,
        done
      )

  })
})
