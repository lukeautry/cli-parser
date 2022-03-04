import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.list("deno run examples/nested.ts", {
    description: "This is a CLI with multiple commands",
    commands: (b) =>
      b.list("first", {
        description: "First command",
        commands: (b) =>
          b
            .command("second", {
              description: "Second command",
              args: (a) =>
                a
                  .add({ name: "bus", type: "string", alias: "b" })
                  .add({
                    name: "car",
                    type: "integer",
                    default: 123,
                    choices: [
                      123,
                      567,
                    ],
                  })
                  .add({ name: "train", type: "boolean" })
                  .run((v) => console.log(v)),
            })
            .command("third", {
              description: "Third command",
              args: (a) =>
                a.add({ name: "b", type: "string" }).run(console.log),
            }),
      })
        .command("fourth", {
          description: "Fourth Command",
          args: (a) =>
            a.add({
              name: "apple",
              type: "string",
              array: true,
              default: ["abc", "def"],
            }).run(console.log),
        }),
  }));
