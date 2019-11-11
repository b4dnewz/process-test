import { ChildProcess } from "child_process";

export interface IPrompt {
  question: string | RegExp;
  answer: string;
}

export default function (proc: Partial<ChildProcess>, prompts: IPrompt[]) {

  let buf = "";

  let next = true;
  let match: any = null;

  let cur: IPrompt;
  let question: string | RegExp;
  let answer: string;

  const fn = (data) => {
    buf += data.toString().trim();

    // iterate through next prompt
    if (next) {
      next = false;
      cur = prompts.shift();
      question = cur.question;
      answer = cur.answer;
    }

    const questionType = typeof question;
    switch (questionType) {
      case "string":
        question = question as string;
        match = buf.lastIndexOf(question) === buf.length - (question).length;
        break;
      case "object":
        match = (buf.match(question) != null);
        break;
    }

    if (match) {
      next = true;
      match = false;

      // write prompt answer to stdin
      proc.stdin.write(answer + "\n");

      // When prompts are over close stdin
      // and unbind the prompt respond function
      if (prompts.length === 0) {
        proc.stdin.end();
        proc.stdout.off("data", fn);
      }
    }
  };

  proc.stdout.on("data", fn);

}
