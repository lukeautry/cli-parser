import { Args } from "https://deno.land/std/flags/mod.ts";
import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.125.0/testing/asserts.ts";
import { cliParser } from "./mod.ts";
import { IBuilder } from "./types.ts";

const exec = (args: Args, fn: (builder: IBuilder) => void) => {
  let result: { message: string | undefined; exitCode: number | undefined } = {
    message: undefined,
    exitCode: undefined,
  };
  cliParser(args, fn, (message, exitCode) => {
    result = { message, exitCode };
  });

  return result;
};

Deno.test("parse", async (t) => {
  await t.step("root command", async (t) => {
    await t.step("rejects invalid subcommand", () => {
      const result = exec(
        { _: ["test", "test2"] },
        (b) =>
          b.command("$", {
            args: (a) => a.run(() => undefined),
            description: "desc",
          }),
      );

      assertEquals(result.exitCode, 1);
      assertExists(result.message);
      assertStringIncludes(result.message, "unknown command: test");
    });

    await t.step("with no args", () => {
      let result: Record<never, never> | undefined;
      cliParser(
        { _: [] },
        (b) =>
          b.command("$", {
            args: (a) => a.run((val) => result = val),
            description: "desc",
          }),
      );

      assertExists(result);
      assertEquals(result, {});
    });

    await t.step("single arg, valid input", () => {
      let result: Record<never, never> | undefined;
      cliParser(
        { _: [], "node-ids": "str" },
        (b) =>
          b.command("$", {
            args: (a) =>
              a.add({ name: "node-ids", type: "string" }).run((val) => {
                result = val;
              }),
            description: "desc",
          }),
      );

      assertExists(result);
      assertEquals(result, { "node-ids": "str" });
    });

    await t.step("reject invalid choice", () => {
      const result = exec(
        { _: [], "node-ids": "str" },
        (b) =>
          b.command("$", {
            args: (a) =>
              a.add({ name: "node-ids", type: "string", choices: ["str1"] })
                .run(() => undefined),
            description: "desc",
          }),
      );

      assertEquals(result.exitCode, 1);
      assertExists(result.message);
      assertStringIncludes(
        result.message,
        "node-ids: invalid value str. valid choices: str1",
      );
    });

    await t.step("single arg, flag passed but no value", () => {
      const result = exec(
        { _: [], "node-ids": true },
        (b) =>
          b.command("$", {
            args: (a) =>
              a.add({ name: "node-ids", type: "string" }).run(() => undefined),
            description: "desc",
          }),
      );

      assertEquals(result.exitCode, 1);
      assertExists(result.message);
      assertStringIncludes(result.message, "node-ids: expected string");
    });

    await t.step("optional arg doesn't throw", () => {
      let result: Record<never, never> | undefined;
      cliParser(
        { _: [] },
        (b) =>
          b.command("$", {
            args: (a) =>
              a.add({ name: "node-ids", type: "string", optional: true }).run((
                val,
              ) => result = val),
            description: "desc",
          }),
      );

      assertExists(result);
      assertEquals(result, {});
    });

    await t.step("default arg has value set", () => {
      let result: Record<never, never> | undefined;
      cliParser(
        { _: [] },
        (b) =>
          b.command("$", {
            args: (a) =>
              a.add({ name: "node-ids", type: "string", default: "test123" })
                .run((
                  val,
                ) => result = val),
            description: "desc",
          }),
      );

      assertExists(result);
      assertEquals(result, { "node-ids": "test123" });
    });

    await t.step("alias", async (t) => {
      await t.step("accepts alias", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "n": "val" },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({ name: "node-ids", type: "string", alias: "n" }).run((
                  val,
                ) => result = val),
              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "node-ids": "val" });
      });

      await t.step("merges alias and non-alias", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "n": "val", "node-ids": "val2" },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({
                  name: "node-ids",
                  type: "string",
                  alias: "n",
                  array: true,
                })
                  .run((val) => result = val),
              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "node-ids": ["val2", "val"] });
      });

      await t.step("uses main command even with alias configured", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "node-ids": "val2" },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({
                  name: "node-ids",
                  type: "string",
                  alias: "n",
                })
                  .run((val) => result = val),
              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "node-ids": "val2" });
      });
    });

    await t.step("array type", async (t) => {
      await t.step("rejects boolean", () => {
        const result = exec(
          { _: [] },
          (b) =>
            b.command("$", {
              args: (a) =>
                a
                  .add({
                    name: "node-ids",
                    type: "boolean",
                    array: true,
                    optional: true,
                  })
                  .run(() => undefined),
              description: "desc",
            }),
        );
        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(
          result.message,
          "arrays not supported for boolean type",
        );
      });

      await t.step("rejects invalid choice", () => {
        const result = exec(
          { _: [], "node-ids": ["test1", "test3"] },
          (b) =>
            b.command("$", {
              args: (a) =>
                a
                  .add({
                    name: "node-ids",
                    type: "string",
                    array: true,
                    choices: [
                      "test1",
                      "test2",
                    ],
                  })
                  .run(() => undefined),
              description: "desc",
            }),
        );
        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(
          result.message,
          "node-ids: invalid value test3 at index 1. valid choices: test1, test2",
        );
      });

      await t.step("resolves single value", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "node-ids": "1234" },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({ name: "node-ids", type: "string", array: true }).run((
                  val,
                ) => result = val),
              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "node-ids": ["1234"] });
      });

      await t.step("resolves multiple values", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "node-ids": ["1234", "5678"] },
          (b) =>
            b.command("$", {
              args: (a) =>
                a
                  .add({ name: "node-ids", type: "string", array: true })
                  .run((val) => result = val),

              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "node-ids": ["1234", "5678"] });
      });
    });

    await t.step("integer", async (t) => {
      await t.step("rejects string", () => {
        const result = exec(
          { _: [], "int-value": "test" },
          (b) =>
            b.command("$", {
              args: (a) =>
                a
                  .add({ name: "int-value", type: "integer" })
                  .run(() => undefined),
              description: "desc",
            }),
        );

        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(result.message, "int-value: expected integer");
      });

      await t.step("rejects boolean flag", () => {
        const result = exec(
          { _: [], "int-value": true },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({ name: "int-value", type: "integer" }).run(() =>
                  undefined
                ),
              description: "desc",
            }),
        );

        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(result.message, "int-value: expected integer");
      });

      await t.step("rejects non-integer number", () => {
        const result = exec(
          { _: [], "int-value": 123.3 },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({ name: "int-value", type: "integer" }).run(() =>
                  undefined
                ),
              description: "desc",
            }),
        );

        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(result.message, "int-value: expected integer");
      });

      await t.step("resolves integer", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: [], "int-value": 123 },
          (b) =>
            b.command("$", {
              args: (a) =>
                a.add({ name: "int-value", type: "integer" }).run((val) => {
                  result = val;
                }),
              description: "desc",
            }),
        );

        assertExists(result);
        assertEquals(result, { "int-value": 123 });
      });
    });

    await t.step("kitchen sink", () => {
      let result: Record<never, never> | undefined;
      cliParser(
        {
          _: [],
          "int-value": 123,
          "str-value": "str",
          "num-value": 66.66,
          "bool-value": true,
          "str-array": ["abc", "def"],
          "zero-value-as-int": 0,
          "zero-value-as-num": 0,
        },
        (b) =>
          b.command("$", {
            args: (a) =>
              a
                .add({ name: "int-value", type: "integer" })
                .add({ name: "str-value", type: "string" })
                .add({ name: "num-value", type: "number" })
                .add({ name: "bool-value", type: "boolean" })
                .add({ name: "str-array", type: "string", array: true })
                .add({ name: "zero-value-as-int", type: "integer" })
                .add({ name: "zero-value-as-num", type: "number" })
                .run((val) => result = val),
            description: "desc",
          }),
      );

      assertExists(result);
      assertEquals(result, {
        "int-value": 123,
        "str-value": "str",
        "num-value": 66.66,
        "bool-value": true,
        "str-array": ["abc", "def"],
        "zero-value-as-int": 0,
        "zero-value-as-num": 0,
      });
    });

    await t.step("help command", () => {
      const result = exec(
        {
          _: [],
          "help": true,
        },
        (b) =>
          b.command("$", {
            args: (a) =>
              a
                .add({ name: "int-value", type: "integer" })
                .add({ name: "str-value", type: "string" })
                .add({ name: "num-value", type: "number" })
                .add({ name: "bool-value", type: "boolean" })
                .add({ name: "str-array", type: "string", array: true })
                .add({ name: "zero-value-as-int", type: "integer" })
                .add({ name: "zero-value-as-num", type: "number" })
                .run(() => undefined),
            description: "desc",
          }),
      );

      assertEquals(result.exitCode, 0);
      assertExists(result.message);
    });
  });

  await t.step("command list", async (t) => {
    await t.step("single command in list", async (t) => {
      await t.step("rejects unknown subcommand", () => {
        const result = exec(
          { _: ["first_"] },
          (b) =>
            b.list("$", {
              commands: (b) =>
                b.command("first", {
                  args: (a) => a.run(() => undefined),
                  description: "cmd",
                }),
              description: "desc",
            }),
        );

        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(result.message, "unknown command: first_");
      });

      await t.step("rejects superfluous subcommand", () => {
        const result = exec(
          { _: ["first", "second"] },
          (b) =>
            b.list("$", {
              description: "desc",
              commands: (b) =>
                b.command("first", {
                  args: (a) => a.run(() => undefined),
                  description: "cmd",
                }),
            }),
        );

        assertEquals(result.exitCode, 1);
        assertExists(result.message);
        assertStringIncludes(result.message, "unknown command: second");
      });

      await t.step("with no args", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: ["first"] },
          (b) =>
            b.list("$", {
              description: "desc",
              commands: (b) =>
                b.command("first", {
                  args: (a) => a.run((val) => result = val),
                  description: "cmd",
                }),
            }),
        );

        assertEquals(result, {});
      });

      await t.step("with some args", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: ["first"], second: "str" },
          (b) =>
            b.list("$", {
              description: "desc",
              commands: (b) =>
                b.command("first", {
                  args: (a) =>
                    a.add({ name: "second", type: "string" }).run((val) =>
                      result = val
                    ),
                  description: "cmd",
                }),
            }),
        );

        assertEquals(result, { second: "str" });
      });

      await t.step("double nested", () => {
        let result: Record<never, never> | undefined;
        cliParser(
          { _: ["first", "second"], third: "str" },
          (b) =>
            b.list("$", {
              description: "desc",
              commands: (b) =>
                b.list("first", {
                  description: "second desc",
                  commands: (b) =>
                    b.command("second", {
                      description: "third desc",
                      args: (a) =>
                        a.add({ name: "third", type: "string" }).run((val) =>
                          result = val
                        ),
                    }),
                }),
            }),
        );

        assertEquals(result, { third: "str" });
      });
    });
  });
});
