import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

console.log(parse(Deno.args));

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
                .add("bus", { type: "string", alias: "b" })
                .add("car", { type: "integer", optional: true }, [123, 567])
                .add(
                  "train",
                  { type: "boolean" },
                )
                .run((v) => {
                  console.log(v);
                }),
          }).command("third", {
            description: "Third command",
            args: (a) => a.add("b", { type: "string" }).run(console.log),
          }),
      }),
  }));
