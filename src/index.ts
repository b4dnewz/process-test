import {ForkOptions, SpawnOptions} from "child_process";

import Process from "./process";

function run(method, cmd, args?, options?) {
  if (args && Array.isArray(args) === false) {
    options = args;
    args = [];
  }

  return new Process({
    args,
    cmd,
    method,
    options,
  });
}

export function fork(modulePath: string, args?: string[] | ForkOptions): Process;
export function fork(modulePath: string, args: string[], options?: ForkOptions): Process;
export function fork(modulePath: string, args?: string[], options?: ForkOptions): Process {
  return run("fork", modulePath, args, options);
}

export function spawn(command: string, args?: string[] | SpawnOptions): Process;
export function spawn(command: string, args: string[], options?: SpawnOptions): Process;
export function spawn(command: string, args?: string[], options?: SpawnOptions): Process {
  return run("spawn", command, args, options);
}
