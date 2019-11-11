import { ForkOptions, SpawnOptions } from "child_process";
import Process from "./process";
import run from "./run";

function fork(modulePath: string, args?: string[] | ForkOptions): Process;
function fork(modulePath: string, args: string[], options?: ForkOptions): Process;
function fork(modulePath: string, args?: string[], options?: ForkOptions): Process {
    return run("fork", modulePath, args, options);
}

/**
 * Creates a customized fork instance with default options
 * useful in case you want to execute code with pre-processors, compilers, ...
 */
fork.instance = (options: ForkOptions) => (modulePath: string, args?: string[], opts?: ForkOptions) => {
    return run("fork", modulePath, args, {
        ...options,
        ...opts,
    });
};

export { fork };
