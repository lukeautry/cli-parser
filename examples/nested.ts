import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.list("deno run examples/nested.ts", {
    description: "This is a CLI with multiple commands",
    commands: (b) =>
      b.list("first", {
        description: "First command",
        commands: (b) =>
          b.command("second", {
            description: "Second command",
            args: (a) =>
              a
                .add("b", { type: "string" })
                .add("c", { type: "integer", optional: true }, [123, 567])
                .add(
                  "d",
                  { type: "boolean" },
                )
                .run(console.log),
          }).command("third", {
            description: "Third command",
            args: (a) => a.add("b", { type: "string" }).run(console.log),
          }),
      }),
  }));
