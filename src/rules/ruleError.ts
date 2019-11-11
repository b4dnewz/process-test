import { isError } from "../utils";
import Rule from "./rule";

export default class ErrorRule extends Rule {
  public assert(actual: any, expected: any, message: string) {
    if (isError(expected)) { expected = expected.message; }
    actual = actual && actual.message;
    return super.assert(actual, expected, message);
  }
}
