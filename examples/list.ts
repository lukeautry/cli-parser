import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.list("deno run examples/list.ts", {
    description: "This is a CLI with a command list",
    commands: (b) =>
      b.command("first", {
        description: "First command",
        args: (a) => a.add({ name: "a", type: "string" }).run(console.log),
      }),
  }));
