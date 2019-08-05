import * as assert from "assert";

import Process from "./process";
import {isRegExp} from "./utils";

export default class Rule {

  protected readonly context: Process;

  private readonly type: string;
  private readonly expected: any[];
  private readonly isOpposite: boolean;

  constructor({ ctx, type, expected, isOpposite }) {
    this.context = ctx;
    this.type = type;
    this.expected = [].concat(expected);
    this.isOpposite = isOpposite === true;
  }

  public validate(message?: string) {
    const actual = this.context[this.type];
    for (const expected of this.expected) {
      this.assert(actual, expected, message);
    }
  }

  public assert(actual, expected, message) {
    const assertFn = assert[this.isOpposite ? "notStrictEqual" : "strictEqual"];

    if (isRegExp(expected)) {
      return assertFn(expected.test(actual), true, `Expected ${expected} to match ${actual}`);
    }

    return assertFn(actual, expected, message);
  }
}
