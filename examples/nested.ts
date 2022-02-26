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
          }).command("third", {
            description: "Third command",
            args: {
              b: {
                type: "string",
              },
            },
            run: (v) => console.log(v),
          }),
      }),
  }));
