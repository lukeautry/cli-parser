import { execute } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

execute(parse(Deno.args), {
  type: "command",
  description: "this is a CLI with only one command",
  args: {
    first: {
      type: "string",
      description: "this is the first argument",
    },
    second: {
      type: "integer",
    },
  },
  run: (val) => console.log(val),
});
