import { execute } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

execute(parse(Deno.args), {
  type: "command-list",
  description: "this is a CLI with multiple commands",
  commands: {
    first: {
      type: "command-list",
      description: "first command",

      commands: {
        second: {
          type: "command",
          description: "second command",
          args: {
            b: {
              type: "string",
            },
            c: {
              type: "integer",
            },
            d: {
              type: "boolean",
            },
          },
          run: (v) => console.log(v),
        },
        third: {
          type: "command",
          description: "third command",
          args: {
            b: {
              type: "string",
            },
          },
          run: (v) => console.log(v),
        },
      },
    },
  },
});
