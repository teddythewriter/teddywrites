import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { pickNext } = require("../themes/teddywrites/assets/js/opening-line.js");

test("a single entry always returns 0", () => {
  assert.equal(pickNext(1, 0, Math.random), 0);
});

test("never repeats the current entry and stays in range", () => {
  for (let current = 0; current < 5; current++) {
    for (let trial = 0; trial < 200; trial++) {
      const next = pickNext(5, current, Math.random);
      assert.notEqual(next, current);
      assert.ok(next >= 0 && next < 5, `out of range: ${next}`);
    }
  }
});

test("with two entries it always flips", () => {
  assert.equal(pickNext(2, 0, () => 0.99), 1);
  assert.equal(pickNext(2, 1, () => 0), 0);
});

test("initial pick (current -1) can return any index", () => {
  assert.equal(pickNext(3, -1, () => 0), 0);
  assert.equal(pickNext(3, -1, () => 0.99), 2);
});
