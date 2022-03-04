import { Args } from "https://deno.land/std@0.126.0/flags/mod.ts";
import {
  getCommandHelpText,
  getCommandListHelpText,
} from "./common/help-text.ts";
import { getListCommands } from "./common/list-commands.ts";
import { parseArgs } from "./common/parse-args.ts";
import {
  ArgumentOptions,
  CLIType,
  CLITypes,
  IArgumentsBuilder,
  IBuilder,
  IRootBuilder,
} from "./types.ts";

export const cliParser = (
  args: Args,
  fn: (builder: IRootBuilder) => void,
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
          onEmit(`unknown command: ${args._[0]}`, 1);
          return builder;
        }

        const commandOptions = {} as Record<
          string,
          ArgumentOptions<
            string,
            CLIType,
            CLITypes[CLIType],
            CLITypes[CLIType],
            boolean,
            boolean
          >
        >;

        const argsBuilder = {
          add: (options) => {
            commandOptions[options.name] = options;
            return argsBuilder;
          },
          run: (fn) => {
            fn(parseArgs(args, commandOptions));
            return null;
          },
        } as IArgumentsBuilder<{}>;

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
        return builder;
      }

      const subcommand = commands[commandInput];
      if (!subcommand) {
        onEmit(
          `\r\nERROR: unknown command: ${commandInput}\r\n${
            getCommandListHelpText(name, list)
          }`,
          1,
        );
        return builder;
      }

      cliParser(
        { ...args, _: args._.slice(1) },
        (b) =>
          "args" in subcommand
            ? b.command(`${name} ${commandInput}`, subcommand)
            : b.list(`${name} ${commandInput}`, subcommand),
        onEmit,
      );

      return builder;
    },
  };

  fn(builder);
};
