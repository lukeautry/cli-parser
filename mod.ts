import { Args } from "https://deno.land/std@0.126.0/flags/mod.ts";
import { typeValidators } from "./type-validators.ts";
import {
  CLIType,
  CommandArgs,
  IArgumentOptions,
  ICommandLike,
  ICommandList,
  ITerminalCommand,
  OptionalityFromArgumentOptions,
} from "./types.ts";

interface ICreateCLIResponse {
  ok: boolean;
  message?: string;
}

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

const getTerminalCommandHelpText = <
  T extends CommandArgs,
>(config: ITerminalCommand<T>) => {
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

const getCommandListHelpText = <A extends CommandArgs>(
  config: ICommandList<A>,
) => {
  return `
USAGE: $ [COMMAND] [OPTIONS]
${config.description ? `\r\n${config.description}\r\n` : ""}
COMMANDS:

${
    Object.keys(config.commands).map((key) => {
      const value = config.commands[key];
      return `  ${key}: ${value.description}`;
    }).join("\r\n\r\n")
  }
  `;
};

export const parse = <A extends CommandArgs>(
  args: Args,
  config: ICommandLike<A>,
): ICreateCLIResponse => {
  try {
    if (config.type === "command") {
      if (args.help === true) {
        return {
          ok: true,
          message: getTerminalCommandHelpText(config),
        };
      }

      if (args._.length > 0) {
        throw new Error(`unknown command: ${args._[0]}`);
      }

      config.run(parseArgs(args, config.args));
      return { ok: true };
    }

    const commandInput = args._[0];
    if (!commandInput) {
      throw new Error(getCommandListHelpText(config));
    }

    const subcommand = config.commands[commandInput];
    if (!subcommand) {
      throw new Error(`unknown command: ${commandInput}`);
    }

    return parse({
      ...args,
      _: args._.slice(1),
    }, subcommand);
  } catch (err) {
    return { ok: false, message: err.message };
  }
};

export const execute = <A extends CommandArgs>(
  args: Args,
  config: ICommandLike<A>,
) => {
  const { message } = parse(args, config);
  if (message) {
    console.log(message);
  }
};
