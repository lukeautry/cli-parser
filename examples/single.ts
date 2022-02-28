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
        }, ["test", "test1"])
        .add("second", { type: "integer" })
        .run((v) => {
          console.log(v.first, v.second);
        }),
  }));
