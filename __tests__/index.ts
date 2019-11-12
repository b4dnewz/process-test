import * as path from "path";

import { fork, spawn } from "../src/index";
import Process from "../src/process";

const fixtures = path.join(__dirname, "../__fixtures__");

describe("module", () => {

  it("should work", (done) => {
    fork(path.resolve(fixtures, "stdout-stderr.js"))
      .expect("stdout", "write to stdout")
      .expect("code", 0)
      .end(done);
  });

  it("should fail", (done) => {
    fork(path.resolve(fixtures, "stdout-stderr.js"))
      .expect("stdout", "__write to stdout__")
      .expect("code", 0)
      .end((err) => {
        expect(err).toBeDefined();
        expect(err.name).toMatch("AssertionError");
        done();
      });
  });

  it("should support expectation", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).expect("code", 0)
      .end(done);
  });

  it("should support negated expectation", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).notExpect("code", 1)
      .end(done);
  });

  it("should support multiple expectations", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).expect("stdout", [/write/, /to stdout/])
      .end(done);
  });

  it("should support expectation after process end", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).end(function (err) {
      this.expect("stdout", "write to stdout");
      done();
    });
  });

  it("should capture stdout", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).expect("stdout", "write to stdout")
      .expect("code", 0)
      .end(done);
  });

  it("should support promises", async () => {
    const res = await new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).end();
    expect(res.stdout).toEqual("write to stdout");
  });

  it("should end with result", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).end((err, res) => {
      expect(err).toBeUndefined();
      expect(res.stdout).toEqual("write to stdout");
      done();
    });
  });

  it("should force process timeout", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "alive.js"),
      method: "fork",
    }).timeout(2500)
      .expect("error", /timeout/)
      .end(done);
  })

  it("should exit with error code", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "process-exit.js"),
      method: "fork",
    }).expect("stdout", "exit 1")
      .expect("code", 1)
      .end(done);
  });

  it("should support ready callback", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "alive.js"),
      method: "fork",
    }).ready(function (next) {
      const proc = this;
      const checkFn = setInterval(() => {
        if (proc.stdout === "listening") {
          clearInterval(checkFn);
          next();
        }
      }, 250);
    })
      .end(done);
  });

  it("should set process options", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "cwd.js"),
      method: "fork",
      options: {
        cwd: fixtures,
      },
    }).expect("stdout", fixtures)
      .expect("code", 0)
      .end(done);
  });

  it("should support data from stdin", (done) => {
    new Process({
      cmd: path.resolve(fixtures, "stdin.js"),
      method: "fork",
    })
      .write("1\n")
      .write("2")
      .expect("stdout", "1\n2")
      .expect("code", 0)
      .end(done);
  });

  it("should return a promise if no callback", () => {
    return new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).expect("stdout", "write to stdout")
      .expect("code", 0)
      .end();
  });

  it("should reject promise if error", () => {
    const p = new Process({
      cmd: path.resolve(fixtures, "stdout-stderr.js"),
      method: "fork",
    }).expect("stdout", "no write")
      .end();
    return expect(p).rejects.toMatchObject({
      name: /AssertionError/,
    });
  });

  it("should respond to prompt questions", (done) => {
    const p = new Process({
      cmd: path.resolve(fixtures, "prompt.js"),
      method: "fork",
    }).prompt({
      question: "Are you waiting?",
      answer: "yes",
    }).expect("stdout", "Are you waiting? yes\n")
      .end(done);
  });

  describe("fork", () => {
    it("should work with first argument only", (done) => {
      fork(path.resolve(fixtures, "stdout-stderr.js"))
        .expect("stdout", "write to stdout")
        .expect("code", 0)
        .end(done);
    });

    it("should accept process args as second argument", (done) => {
      const cmdPath = path.resolve(fixtures, "argv.js");
      fork(cmdPath, ["test", "man"])
        .expect("stdout", "test man")
        .expect("code", 0)
        .end(done);
    });

    it("should accept process options as second argument", (done) => {
      const cmdPath = path.resolve(fixtures, "cwd.js");
      fork(cmdPath, {
        cwd: fixtures,
      })
        .expect("stdout", fixtures)
        .expect("code", 0)
        .end(done);
    });

    it("should accept three argument and send to process", (done) => {
      const cmdPath = path.resolve(fixtures, "cwd.js");
      fork(cmdPath, ["test"], {
        cwd: fixtures,
      })
        .expect("stdout", fixtures)
        .expect("code", 0)
        .end(done);
    });
  });

  describe("spawn", () => {
    it("should assert error", (done) => {
      const cmd = path.join(fixtures, "unknown.js");
      spawn(cmd)
        .expect("error", /ENOENT/)
        .expect("error", "spawn " + cmd + " ENOENT")
        .expect("error", new Error("spawn " + cmd + " ENOENT"))
        .end(done);
    });

    it("should spawn system process", (done) => {
      spawn("node", ["--version"])
        .expect("stdout", new RegExp(process.version))
        .expect("code", 0)
        .end(done);
    });

    it("should send arguments to spawned process", (done) => {
      const cmd = path.join(fixtures, "argv.js");
      spawn("node", [cmd, fixtures])
        .expect("stdout", fixtures)
        .expect("code", 0)
        .end(done);
    });
  });

  describe("debug", () => {
    const mockOut = jest.spyOn(process.stdout, "write");
    const mockErr = jest.spyOn(process.stderr, "write");

    afterEach(() => {
      mockOut.mockReset();
      mockErr.mockReset();
    });

    afterAll(() => {
      mockOut.mockRestore();
      mockErr.mockRestore();
    });

    it("should disable", (done) => {
      new Process({
        cmd: path.resolve(fixtures, "stdout-stderr.js"),
        method: "fork",
      }).debug(false)
        .end(() => {
          expect(mockOut).not.toHaveBeenCalled();
          expect(mockErr).not.toHaveBeenCalled();
          done();
        });
    });

    it("should enable", (done) => {
      new Process({
        cmd: path.resolve(fixtures, "stdout-stderr.js"),
        method: "fork",
      }).debug(true)
        .end(() => {
          expect(mockOut).toHaveBeenCalled();
          expect(mockErr).toHaveBeenCalled();
          done();
        });
    });

    it("should enable stdout only", (done) => {
      new Process({
        cmd: path.resolve(fixtures, "stdout-stderr.js"),
        method: "fork",
      }).debug(1)
        .end(() => {
          expect(mockOut).toHaveBeenCalled();
          expect(mockErr).not.toHaveBeenCalled();
          done();
        });
    });

    it("should enable stderr only", (done) => {
      new Process({
        cmd: path.resolve(fixtures, "stdout-stderr.js"),
        method: "fork",
      }).debug(2)
        .end(() => {
          expect(mockOut).not.toHaveBeenCalled();
          expect(mockErr).toHaveBeenCalled();
          done();
        });
    });
  });

});
