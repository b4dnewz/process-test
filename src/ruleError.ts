import Rule from "./rule";
import {isError} from "./utils";

export default class ErrorRule extends Rule {
  public assert(actual, expected, message) {
    if (isError(expected)) { expected = expected.message; }
    actual = actual && actual.message;
    return super.assert(actual, expected, message);
  }
}
