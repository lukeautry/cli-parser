import { Args } from "https://deno.land/std@0.126.0/flags/mod.ts";
import { typeValidators } from "./type-validators.ts";
import {
  CLIType,
  CLITypes,
  IArgumentOptions,
  IArgumentOptionsWithChoices,
  IArgumentsBuilder,
  IBuilder,
  ICommand,
  ICommandList,
} from "./types.ts";

const parseArgs = <
  T extends Record<string, IArgumentOptionsWithChoices<CLIType>>,
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
        result[key] = false;
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

    if (arg.choices) {
      const val = result[key];

      if (Array.isArray(val)) {
        val.forEach((v, i) => {
          if (!arg.choices.includes(v)) {
            throw new Error(
              `${key}: invalid value ${v} at index ${i}. valid choices: ${
                arg.choices.join(", ")
              }`,
            );
          }
        });
      } else {
        if (!arg.choices.includes(result[key] as CLITypes[CLIType])) {
          throw new Error(
            `${key}: invalid value ${result[key]}. valid choices: ${
              arg.choices.join(", ")
            }`,
          );
        }
      }
    }

    return result;
  }, {} as Record<string, CLITypes[CLIType] | CLITypes[CLIType][] | undefined>);
};

const getCommandHelpText = (name: string, command: ICommand) => {
  const args = new Array<
    IArgumentOptions<CLIType> & {
      name: string;
      // deno-lint-ignore no-explicit-any
      choices: ReadonlyArray<any> | undefined;
    }
  >();

  const builder: IArgumentsBuilder = {
    add: (name, options, choices) => {
      args.push({
        ...options,
        name,
        choices,
      });
      // deno-lint-ignore no-explicit-any
      return builder as any;
    },
    run: () => null,
  };

  command.args(builder);

  return `
USAGE: ${name} [OPTIONS]
${command.description ? `\r\n${command.description}\r\n` : ""}
OPTIONS:

${
    args.map(
      ({ name, type, array, optional, description, choices }) => {
        return `  --${name}: [${type}${array === true ? "[]" : ""}] [${
          optional === true ? "optional" : "required"
        }]${choices ? ` [choices: ${choices.join(", ")}]` : ""}${
          description ? `\r\n      ${description}` : ""
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
  const commands = {} as Record<string, ICommand | ICommandList>;

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
    command: (name, options) => {
      if (args.help === true) {
        onEmit(getCommandHelpText(name, options), 0);
        return builder;
      }

      try {
        if (args._.length > 0) {
          throw new Error(`unknown command: ${args._[0]}`);
        }

        const commandArgs = {} as Record<
          string,
          IArgumentOptionsWithChoices<CLIType>
        >;

        const argsBuilder: IArgumentsBuilder = {
          // deno-lint-ignore no-explicit-any
          add: (name, options, choices: any) => {
            commandArgs[name] = {
              ...options,
              choices,
            };
            // deno-lint-ignore no-explicit-any
            return argsBuilder as IArgumentsBuilder<any>;
          },
          run: (fn) => {
            fn(parseArgs(args, commandArgs));
            return null;
          },
        };

        options.args(argsBuilder);
      } catch (err) {
        onEmit(
          `\r\nERROR: ${err.message}\r\n${getCommandHelpText(name, options)}`,
          1,
        );
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
        onEmit(
          `\r\nERROR: unknown command: ${commandInput}\r\n${
            getCommandListHelpText(name, list)
          }`,
          1,
        );
        return;
      }

      cliParser(
        { ...args, _: args._.slice(1) },
        (b) =>
          "args" in subcommand
            ? b.command(`${name} ${commandInput}`, subcommand)
            : b.list(`${name} ${commandInput}`, subcommand),
        onEmit,
      );
    },
  };

  fn(builder);
};
