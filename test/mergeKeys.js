import "should"
import {Observable as O} from "rx"
import {mergeKeys} from "../src/index"

describe("mergeKeys", () => {

  it("merges streams from same object keys", done => {
    const a = { A: O.just("aa"), B: O.just("ab") }
    const b = { A: O.just("ba") }
    const res = mergeKeys(a, b)
    Object.keys(res).should.deepEqual(["A", "B"])
    res.A.bufferWithCount(2).subscribe(
      xs => xs.should.deepEqual(["aa", "ba"]),
      done.fail,
      () => res.B.bufferWithTime(10).first().subscribe(
        xs => xs.should.deepEqual(["ab"]),
        done.fail,
        done
      )
    )
  })

})
