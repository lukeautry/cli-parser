import { cliParser } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

cliParser(parse(Deno.args), (b) =>
  b.command("deno run examples/single.ts", {
    description: "This is a CLI with only one command",
    args: (a) => {
      return a
        .add({
          name: "first",
          description: "This is the first argument",
          type: "string",
          array: true,
          choices: ["test", "test1"],
          default: ["test"],
        })
        .add({ name: "second", type: "integer" })
        .run((v) => {
          console.log(v.first, v.second);
        });
    },
  }));
