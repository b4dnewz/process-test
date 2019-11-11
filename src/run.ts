import Process, { ProcessOptions, ProcessType } from "./process";

export default function run(
    method: ProcessType,
    cmd: string,
    args?: string[] | ProcessOptions,
    options?: ProcessOptions,
) {
    if (args && Array.isArray(args) === false) {
        options = args as ProcessOptions;
        args = [];
    }

    return new Process({
        args: args as string[],
        cmd,
        method,
        options,
    });
}
