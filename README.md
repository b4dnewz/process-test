# process-test

> Easy way to test command line applications

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url]

This project is mainly based on [coffee](https://github.com/node-modules/coffee) but implemented in TypeScript with no dependencies.

## Install

```
npm install @b4dnewz/process-test
```

## Usage

You can use it in your tests with any framework to test your code execution:

```ts
import {fork, spawn} from "@b4dnewz/process-test"

// Spawn a nodejs process
it("will spawn node script", (done) => {
  fork("./test.js", ["foo", "bar"], {})
    .expect("stdout", /foo bar/)
    .expect("code", 0)
    .end(done);
})

// Spawn a system command
it("will spawn system command", (done) => {
  spawn("node", ["--version"], {})
    .expect("stdout", process.version)
    .expect("code", 0)
    .end(done);
})
```

File used in usage example _test.js_

```js
#!/usr/bin/env node

const argv = process.argv.slice(2).join(" ")
process.stdout.write(argv);
```

## API

#### fork

This method is used specifically to spawn new Node.js process using the given file path, arguments and [options](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options).

```js
// fork(binPath)
fork("./test.js")

// fork(binPath, args)
fork("./test.js", ["--foo", "bar"])

// fork(binPath, args, options)
fork("./test.js", ["foo"], { env: {} })
```

#### spawn

This method spawns a new process using the given command, arguments and [options](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

```js
// spawn(binPath)
spawn("node")

// spawn(binPath, args)
spawn("node", ["--version"])

// spawn(binPath, args, options)
spawn("ls", ["-l"], {
  cwd: "/home"
})
```

All the methods returns a test Process class which has the following method to interact with the process and the result:

#### expect(type, expectation)

This method is used to set an expectation of the process result.

```js
spawn("node", ["--version"])
  .expect("stdout", new RegExp(process.version))
  .expect("code", 0);
```

#### notExpect(type, expectation)

This method is used to set an expectation of the process result.

```js
spawn("node", ["--version"])
  .notExpect("code", 1);
```

---

## License

MIT © [Filippo Conti](https://b4dnewz.github.io/)

[npm-image]: https://badge.fury.io/js/%40b4dnewz%2Fprocess-test.svg
[npm-url]: https://npmjs.org/package/@b4dnewz/process-test
[travis-image]: https://travis-ci.org/b4dnewz/process-test.svg?branch=master
[travis-url]: https://travis-ci.org/b4dnewz/process-test
[coveralls-image]: https://coveralls.io/repos/b4dnewz/process-test/badge.svg
[coveralls-url]: https://coveralls.io/r/b4dnewz/process-test
