import { Args } from "https://deno.land/std@0.126.0/flags/mod.ts";
import { typeValidators } from "./type-validators.ts";
import {
  CLIType,
  CommandArgs,
  IArgumentOptions,
  IBuilder,
  ICommand,
  ICommandList,
  OptionalityFromArgumentOptions,
} from "./types.ts";

const parseArgs = <
  T extends Record<string, IArgumentOptions<CLIType>>,
>(
  rawArgs: Args,
  args: T,
) => {
  return (Object.keys(args)).reduce((result, key) => {
    const arg = args[key];
    const rawVal = rawArgs[key];

    if (arg.type === "boolean" && arg.array) {
      throw new Error(`arrays not supported for boolean type`);
    }

    if (rawVal === undefined) {
      if (arg.type === "boolean") {
        result[key] = false as OptionalityFromArgumentOptions<T[string]>;
        return result;
      }

      if (arg.optional === true) {
        return result;
      }

      throw new Error(
        `argument ${key} required: expected ${arg.type}${
          arg.array ? "[]" : ""
        }`,
      );
    }

    if (typeof rawVal === "boolean" && arg.type !== "boolean") {
      throw new Error(
        `${key}: expected ${arg.type}${arg.array ? "[]" : ""}`,
      );
    }

    if (arg.array) {
      result[key] = Array.isArray(rawVal)
        // deno-lint-ignore no-explicit-any
        ? (rawVal as Array<any>).map((v) => typeValidators[arg.type](v, key))
        : [
          typeValidators[arg.type](rawVal, key),
        ];
    } else {
      result[key] = typeValidators[arg.type](
        rawVal,
        key,
      );
    }

    return result;
    // deno-lint-ignore no-explicit-any
  }, {} as any);
};

const getCommandHelpText = <
  A extends CommandArgs,
>(config: ICommand<A>) => {
  return `
USAGE: $ [OPTIONS]
${config.description ? `\r\n${config.description}\r\n` : ""}
OPTIONS:

${
    Object.entries(config.args).map(
      ([key, value]) => {
        return `  --${key}: ${value.type}${
          value.array === true ? "[]" : ""
        }, [${value.optional === true ? "optional" : "required"}]${
          value.description ? `\r\n      ${value.description}` : ""
        }`;
      },
    ).join("\r\n\r\n")
  }
  `;
};

const getCommandListHelpText = (
  name: string,
  list: ICommandList,
) => {
  const commands = getListCommands(list);

  console.log({ commands });

  return `
USAGE: ${name} [COMMAND] [OPTIONS]
${list.description ? `\r\n${list.description}\r\n` : ""}
COMMANDS:

${
    Object.keys(commands).map((key) => {
      const value = commands[key];
      return `  ${key}: ${value.description}`;
    }).join("\r\n\r\n")
  }
  `;
};

const getListCommands = (list: ICommandList) => {
  // deno-lint-ignore no-explicit-any
  const commands = {} as Record<string, ICommand<any> | ICommandList>;

  const builder: IBuilder = {
    command: (name, options) => {
      commands[name] = options;

      return builder;
    },
    list: (name, options) => {
      commands[name] = options;

      return builder;
    },
  };

  list.commands(builder);
  return commands;
};

export const cliParser = (
  args: Args,
  fn: (builder: IBuilder) => void,
  onEmit = (message: string, _exitCode: number) => {
    console.log(message);
  },
): void => {
  const builder: IBuilder = {
    command: (_name, options) => {
      if (args.help === true) {
        onEmit(getCommandHelpText(options), 0);
        return builder;
      }

      if (args._.length > 0) {
        onEmit(`unknown command: ${args._[0]}`, 1);
        return builder;
      }

      try {
        options.run(parseArgs(args, options.args));
      } catch (err) {
        onEmit(err.message, 1);
      }

      return builder;
    },
    list: (name, list) => {
      const commands = getListCommands(list);

      const commandInput = args._[0];
      if (!commandInput) {
        onEmit(getCommandListHelpText(name, list), 1);
        return;
      }

      const subcommand = commands[commandInput];
      if (!subcommand) {
        onEmit(`unknown command: ${commandInput}`, 1);
        return;
      }

      cliParser(
        {
          ...args,
          _: args._.slice(1),
        },
        (b) =>
          "run" in subcommand
            ? b.command(name, subcommand)
            : b.list(name, subcommand),
        onEmit,
      );
    },
  };

  fn(builder);
};
