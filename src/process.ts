import * as cp from "child_process";
import { EventEmitter } from "events";

import Rule from "./rules/rule";
import RuleError from "./rules/ruleError";

type AssertionType = "stdout" | "stderr" | "code" | "error";

type ExpectationType = number | string | RegExp | Error;

type Expectation = ExpectationType | ExpectationType[];

type ReadyCallback = (this: Process, done: () => void) => void;

export type ProcessType = "fork" | "spawn";

export type ProcessCallback = (this: Process, err: Error, res?: IProcessResult) => void;

export type ProcessOptions = cp.ForkOptions | cp.SpawnOptions;

export interface IProcessConstructor {
  method: ProcessType;
  cmd: string;
  args?: string[];
  options?: ProcessOptions;
}

export interface IProcessResult {
  code: number;
  error: string | Error;
  stderr: string;
  stdout: string;
}

/**
 * Creates a child process and listen for events
 * reporting the execution result
 */
export default class Process extends EventEmitter {

  public stdout: string = "";
  public stderr: string = "";
  public error: Error;
  public code: number;

  /**
   * The child process method name
   */
  public readonly method: ProcessType;

  /**
   * Array of strings to write to process stdin
   */
  private stdin: string[] = [];

  /**
   * The actual command to run
   */
  private readonly cmd: string;

  /**
   * Arguments passed to the command
   */
  private readonly args: string[];

  /**
   * Options passed to the process
   */
  private readonly options: ProcessOptions;

  private readyCb: ReadyCallback;

  /**
   * Function to call when the child process has terminated
   */
  private endCb: ProcessCallback;

  /**
   * Collect the test process expectations
   */
  private assertions: Rule[] = [];

  /**
   * When true the process has ended
   */
  private isComplete: boolean = false;

  private debugStdout: boolean = false;
  private debugStderr: boolean = false;

  /**
   * Process assertion rules map
   */
  private rulesMap = {
    code: Rule,
    error: RuleError,
    stderr: Rule,
    stdout: Rule,
  };

  constructor(opts: IProcessConstructor) {
    super();
    const { method, cmd, args, options = {} } = opts;

    this.method = method;
    this.cmd = cmd;
    this.args = args;
    this.options = options;

    // Only accept these type below for assertion
    this.rulesMap = {
      code: Rule,
      error: RuleError,
      stderr: Rule,
      stdout: Rule,
    };

    this.initHooks();

    process.nextTick(() => {
      this.run();
    });
  }

  /**
   * Enable or disable the debug mode, default is disabled
   * 0 | false (default) -> stdout + stderr
   * 1 -> stdout
   * 2 -> stderr
   */
  public debug(level?: number | boolean) {
    switch (String(level)) {
      case "1":
        this.debugStdout = true;
        break;
      case "2":
        this.debugStderr = true;
        break;
      case "false":
        this.debugStdout = false;
        this.debugStderr = false;
        break;
      default:
        this.debugStdout = true;
        this.debugStderr = true;
    }
    return this;
  }

  /**
   * Add an expectation for the process end
   */
  public expect(type: AssertionType, expectation: Expectation) {
    this.addAssertion({
      expectation,
      type,
    });
    return this;
  }

  /**
   * Add a negated expectation for the process end
   */
  public notExpect(type: AssertionType, expectation: Expectation) {
    this.addAssertion({
      expectation,
      isOpposite: true,
      type,
    });
    return this;
  }

  /**
   * Write string to the stdin
   */
  public write(input: string | string[]) {
    this.stdin = this.stdin.concat(input);
    return this;
  }

  /**
   * Callback used to determine when a process is ready
   * useful to close keep-alive style process manually
   */
  public ready(cb: ReadyCallback) {
    this.readyCb = cb;
    return this;
  }

  /**
   * Runs at the end of a process
   * the callback is run with results
   * and the context is bound to this
   */
  public end(): Promise<IProcessResult>;
  public end(cb?: ProcessCallback): void;
  public end(cb?: ProcessCallback) {
    this.endCb = cb && cb.bind(this);
    if (!cb) {
      return new Promise((resolve, reject) => {
        this.on("complete:success", resolve);
        this.on("complete:error", reject);
      });
    }
  }

  /**
   * Add a user assertion to the list
   */
  private addAssertion({ type, expectation, isOpposite = false }: {
    type: AssertionType,
    expectation: any,
    isOpposite?: boolean,
  }) {
    const RuleConstructor = this.rulesMap[type];
    const rule = new RuleConstructor({
      ctx: this,
      expected: expectation,
      isOpposite,
      type,
    });

    if (this.isComplete) {
      rule.validate();
    } else {
      this.assertions.push(rule);
    }
  }

  private run() {
    const { method, cmd, args = [], options = {} } = this;
    if (method === "fork") {
      (options as cp.ForkOptions).silent = true;
    }

    const handler = cp[method];
    const proc = handler(cmd, args, options);

    if (proc.stdout) {
      proc.stdout.on("data", this.emit.bind(this, "stdout:data"));
    }

    if (proc.stderr) {
      proc.stderr.on("data", this.emit.bind(this, "stderr:data"));
    }

    proc.once("error", this.emit.bind(this, "error"));
    proc.once("close", this.emit.bind(this, "close"));

    if (this.stdin.length) {
      this.stdin.forEach((buf) => proc.stdin.write(buf));
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }

    if (this.readyCb) {
      this.readyCb.bind(this)(() => {
        proc.kill();
      });
    }

    return proc;
  }

  private initHooks() {
    this.on("stdout:data", (buf) => {
      if (this.debugStdout) {
        process.stdout.write(buf);
      }
      this.stdout += buf;
    });

    this.on("stderr:data", (buf) => {
      if (this.debugStderr) {
        process.stderr.write(buf);
      }
      this.stderr += buf;
    });

    // Capture process error
    this.on("error", (err) => {
      this.error = err;
    });

    this.once("close", (code) => {
      this.code = code;
      this.isComplete = true;

      try {
        for (const rule of this.assertions) {
          rule.validate();
        }
      } catch (err) {
        if (this.endCb) {
          this.endCb(err);
        } else {
          this.emit("complete:error", err);
        }
        return;
      }

      const result = {
        code: this.code,
        error: this.error,
        stderr: this.stderr,
        stdout: this.stdout,
      };

      if (this.endCb) {
        this.endCb(undefined, result);
      } else {
        this.emit("complete:success", result);
      }
    });
  }

}
