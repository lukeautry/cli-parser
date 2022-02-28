import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.command("deno run examples/single.ts", {
    description: "This is a CLI with only one command",
    args: (a) =>
      a
        .add("first", {
          type: "string",
          description: "This is the first argument",
          optional: true,
          array: true,
        })
        .add("second", {
          type: "integer",
        })
        .run(console.log),
  }));
