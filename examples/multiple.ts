import { execute } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

execute(parse(Deno.args), {
  type: "command-list",
  description: "this is a CLI with multiple commands",
  commands: {
    first: {
      type: "command",
      description: "first command",
      args: {
        a: {
          type: "string",
        },
      },
      run: (v) => console.log(v),
    },
    second: {
      type: "command",
      description: "second command",
      args: {
        b: {
          type: "string",
        },
      },
      run: (v) => console.log(v),
    },
  },
});
