import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.list("deno run examples/multiple.ts", {
    description: "This is a CLI with multiple commands",
    commands: (b) =>
      b
        .command("first", {
          description: "First command",
          args: (a) => a.add("a", { type: "string" }).run(console.log),
        })
        .command("second", {
          description: "Second command",
          args: (a) => a.add("b", { type: "string" }).run(console.log),
        }),
  }));
