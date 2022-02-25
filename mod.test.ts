import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.125.0/testing/asserts.ts";
import { parse } from "./mod.ts";

Deno.test("parse", async (t) => {
  await t.step("root command", async (t) => {
    await t.step("rejects invalid subcommand", () => {
      const result = parse(
        { _: ["test", "test2"] },
        {
          type: "command",
          args: {},
          run: () => undefined,
          description: "desc",
        },
      );

      assertEquals(result.ok, false);
      assertEquals(result.message, "unknown command: test");
    });

    await t.step("with no args", () => {
      let result: Record<never, never> | undefined;
      parse(
        { _: [] },
        {
          type: "command",
          args: {},
          run: (val) => result = val,
          description: "desc",
        },
      );

      assertExists(result);
      assertEquals(result, {});
    });

    await t.step("single arg, valid input", () => {
      let result: Record<never, never> | undefined;
      parse(
        { _: [], "node-ids": "str" },
        {
          type: "command",
          args: {
            "node-ids": {
              type: "string",
            },
          },
          run: (val) => {
            result = val;
          },
          description: "desc",
        },
      );

      assertExists(result);
      assertEquals(result, { "node-ids": "str" });
    });

    await t.step("single arg, flag passed but no value", () => {
      const result = parse(
        { _: [], "node-ids": true },
        {
          type: "command",
          args: {
            "node-ids": {
              type: "string",
            },
          },
          run: () => undefined,
          description: "desc",
        },
      );

      assertEquals(result.ok, false);
      assertEquals(result.message, "node-ids: expected string");
    });

    await t.step("optional arg doesn't throw", () => {
      let result: Record<never, never> | undefined;
      parse(
        { _: [] },
        {
          type: "command",
          args: {
            "node-ids": {
              type: "string",
              optional: true,
            },
          },
          run: (val) => result = val,
          description: "desc",
        },
      );

      assertExists(result);
      assertEquals(result, {});
    });

    await t.step("array type", async (t) => {
      await t.step("rejects boolean", () => {
        const result = parse(
          { _: [] },
          {
            type: "command",
            args: {
              "node-ids": {
                type: "boolean",
                array: true,
                optional: true,
              },
            },
            run: () => undefined,
            description: "desc",
          },
        );
        assertEquals(result.ok, false);
        assertEquals(result.message, "arrays not supported for boolean type");
      });

      await t.step("resolves single value", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: [], "node-ids": "1234" },
          {
            type: "command",
            args: {
              "node-ids": {
                type: "string",
                array: true,
              },
            },
            run: (val) => result = val,
            description: "desc",
          },
        );

        assertExists(result);
        assertEquals(result, { "node-ids": ["1234"] });
      });

      await t.step("resolves multiple values", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: [], "node-ids": ["1234", "5678"] },
          {
            type: "command",
            args: {
              "node-ids": {
                type: "string",
                array: true,
              },
            },
            run: (val) => result = val,
            description: "desc",
          },
        );

        assertExists(result);
        assertEquals(result, { "node-ids": ["1234", "5678"] });
      });
    });

    await t.step("integer", async (t) => {
      await t.step("rejects string", () => {
        const result = parse(
          { _: [], "int-value": "test" },
          {
            type: "command",
            args: {
              "int-value": {
                type: "integer",
              },
            },
            run: () => undefined,
            description: "desc",
          },
        );

        assertEquals(result.ok, false);
        assertEquals(result.message, "int-value: expected integer");
      });

      await t.step("rejects boolean flag", () => {
        const result = parse(
          { _: [], "int-value": true },
          {
            type: "command",
            args: {
              "int-value": {
                type: "integer",
              },
            },
            run: () => undefined,
            description: "desc",
          },
        );

        assertEquals(result.ok, false);
        assertEquals(result.message, "int-value: expected integer");
      });

      await t.step("rejects non-integer number", () => {
        const result = parse(
          { _: [], "int-value": 123.3 },
          {
            type: "command",
            args: {
              "int-value": {
                type: "integer",
              },
            },
            run: () => undefined,
            description: "desc",
          },
        );

        assertEquals(result.ok, false);
        assertEquals(result.message, "int-value: expected integer");
      });

      await t.step("resolves integer", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: [], "int-value": 123 },
          {
            type: "command",
            args: {
              "int-value": {
                type: "integer",
              },
            },
            run: (val) => result = val,
            description: "desc",
          },
        );

        assertExists(result);
        assertEquals(result, { "int-value": 123 });
      });
    });

    await t.step("kitchen sink", () => {
      let result: Record<never, never> | undefined;
      parse(
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
        {
          type: "command",
          args: {
            "int-value": {
              type: "integer",
            },
            "str-value": {
              type: "string",
            },
            "num-value": {
              type: "number",
            },
            "bool-value": {
              type: "boolean",
            },
            "str-array": {
              type: "string",
              array: true,
            },
            "zero-value-as-int": {
              type: "integer",
            },
            "zero-value-as-num": {
              type: "number",
            },
          },
          run: (val) => result = val,
          description: "desc",
        },
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
      const result = parse(
        {
          _: [],
          "help": true,
        },
        {
          type: "command",
          args: {
            "int-value": {
              type: "integer",
            },
            "str-value": {
              type: "string",
              description: "a string value",
            },
            "num-value": {
              type: "number",
            },
            "bool-value": {
              type: "boolean",
            },
            "str-array": {
              type: "string",
              array: true,
            },
            "zero-value-as-int": {
              type: "integer",
            },
            "zero-value-as-num": {
              type: "number",
            },
          },
          run: () => undefined,
          description: "desc",
        },
      );

      assertEquals(result.ok, true);
      assertExists(result.message);
    });
  });

  await t.step("command list", async (t) => {
    await t.step("single command in list", async (t) => {
      await t.step("rejects unknown subcommand", () => {
        const result = parse(
          { _: ["first_"] },
          {
            type: "command-list",
            commands: {
              first: {
                type: "command",
                args: {},
                description: "cmd",
                run: () => undefined,
              },
            },
            description: "desc",
          },
        );

        assertEquals(result.ok, false);
        assertEquals(result.message, "unknown command: first_");
      });

      await t.step("rejects superfluous subcommand", () => {
        const result = parse(
          { _: ["first", "second"] },
          {
            type: "command-list",
            commands: {
              first: {
                type: "command",
                args: {},
                description: "cmd",
                run: () => undefined,
              },
            },
            description: "desc",
          },
        );

        assertEquals(result.ok, false);
        assertEquals(result.message, "unknown command: second");
      });

      await t.step("with no args", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: ["first"] },
          {
            type: "command-list",
            commands: {
              first: {
                type: "command",
                args: {},
                description: "cmd",
                run: (val) => result = val,
              },
            },
            description: "desc",
          },
        );

        assertEquals(result, {});
      });

      await t.step("with some args", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: ["first"], second: "str" },
          {
            type: "command-list",
            commands: {
              first: {
                type: "command",
                args: {
                  second: {
                    type: "string",
                  },
                },
                description: "cmd",
                run: (val) => result = val,
              },
            },
            description: "desc",
          },
        );

        assertEquals(result, { second: "str" });
      });

      await t.step("double nested", () => {
        let result: Record<never, never> | undefined;
        parse(
          { _: ["first", "second"], third: "str" },
          {
            type: "command-list",
            commands: {
              first: {
                type: "command-list",
                description: "second desc",
                commands: {
                  second: {
                    type: "command",
                    description: "third desc",
                    args: {
                      third: {
                        type: "string",
                      },
                    },
                    run: (val) => result = val,
                  },
                },
              },
            },
            description: "desc",
          },
        );

        assertEquals(result, { third: "str" });
      });
    });
  });
});
