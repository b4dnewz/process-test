import { SpawnOptions } from "child_process";
import Process from "./process";
import run from "./run";

function spawn(command: string, args?: string[] | SpawnOptions): Process;
function spawn(command: string, args: string[], options?: SpawnOptions): Process;
function spawn(command: string, args?: string[], options?: SpawnOptions): Process {
  return run("spawn", command, args, options);
}

/**
 * Creates a customized spawn instance with default options
 * useful in case you want to execute code with pre-processors, compilers, ...
 */
spawn.instance = (options: SpawnOptions) => (command: string, args?: string[], opts?: SpawnOptions) => {
  return run("spawn", command, args, {
    ...options,
    ...opts,
  });
};

export { spawn };
