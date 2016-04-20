import "should"
import Rx, {Observable as O} from "rx"
import R from "ramda"
import {Model} from "../src/index"

function run(MD, main) {
  let obs = null
  const [out, loop] = main(MD(O.create(o => (obs = o) && (() => obs = null))))
  return out.merge(loop.delay(0).filter(x => obs && obs.onNext(x) && false))
}

describe("ModelDriver", () => {

  it("allows re-setting model values with M.set", done => {
    run(Model({}), M => [M, M.set(O.just({msg: "tsers"}))])
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual([{}, {msg: "tsers"}]), done.fail, done)
  })

  it("allows modifying model values with M.mod", done => {
    run(Model(1), M => [M, M.mod(O.just(R.add(2)))])
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual([1, 3]), done.fail, done)
  })

  it("skips duplicate states", done => {
    run(Model(1), M => [M, O.merge(M.set(O.just(1)), M.set(O.just(1)))])
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual([1]), done.fail, done)
  })

  it("allows lensing into sub-model by using M.lens", done => {
    function main(M) {
      const a = M.lens("a")
      return [a, O.empty()]
    }

    run(Model({a: "a", b: "b"}), main)
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual(["a"]), done.fail, done)
  })

  it("allows sub-model modifications like parent model by using .set and .mod", done => {
    function main(M) {
      const a = M.lens("a")
      return [a, a.set(O.just(4)).merge(a.mod(O.just(R.inc)))]
    }

    run(Model({a: 1, b: 2}), main)
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual([1, 4, 5]), done.fail, done)
  })

  it("keeps sub-model state and parent state always in sync", done => {
    function main(M) {
      const a = M.lens("a")
      return [M, a.set(O.just(4)).merge(a.mod(O.just(R.inc)))]
    }

    run(Model({a: 1, b: 2}), main)
      .bufferWithTime(100)
      .first()
      .subscribe(xs => xs.should.deepEqual([{a: 1, b: 2}, {a: 4, b: 2}, {a: 5, b: 2}]), done.fail, done)
  })

  it("allows state console logging", done => {
    const logged = new Rx.Subject()
    logged.subscribe(done)
    run(Model({}, {logging: true, info: () => logged.onNext()}), M => [M, O.empty()])
      .bufferWithTime(100)
      .first()
      .subscribe()
  })

  it("warns if mods are not created by using model functions", done => {
    const warned = new Rx.Subject()
    warned.subscribe(done)
    run(Model({}, {warn: () => warned.onNext()}), M => [M, O.just("foo")])
      .bufferWithTime(100)
      .first()
      .subscribe()
  })

  it("has .liftListBy operator for efficient list processing", done => {
    const mod$ = new Rx.ReplaySubject(4)
    const list$ = Model([{id: 1, msg: "tsers"}])(mod$)
    O.merge(
      list$.set(O.just([{id: 1, msg: "foo"}, {id: 2, msg: "foo"}])).delay(1),
      list$.set(O.just([{id: 1, msg: "bar"}, {id: 2, msg: "foo"}])).delay(2),
      list$.set(O.just([{id: 1, msg: "bar"}, {id: 2, msg: "bar"}])).delay(3),
      list$.set(O.just([{id: 2, msg: "tsers"}])).delay(4)
    ).subscribe(mod$)

    list$.liftListById((_, item$) => ({m: item$.lens("msg")}))
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

