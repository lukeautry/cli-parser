import {
  ArgumentOptions,
  CLIType,
  CLITypes,
  IArgumentsBuilder,
  ICommand,
  ICommandList,
} from "../types.ts";
import { getListCommands } from "./list-commands.ts";

export const getCommandHelpText = (name: string, command: ICommand) => {
  const args = new Array<
    ArgumentOptions<
      string,
      CLIType,
      CLITypes[CLIType],
      CLITypes[CLIType],
      boolean,
      boolean
    >
  >();

  const builder = {
    add: (options) => {
      args.push(options);
      return builder;
    },
    run: () => null,
  } as IArgumentsBuilder<{}>;

  command.args(builder);

  return `
USAGE: ${name} [OPTIONS]
${command.description ? `\r\n${command.description}\r\n` : ""}
OPTIONS:
  
${
    args.map(
      (options) => {
        const { name, type, array, optional, description, choices, alias } =
          options;

        return `  --${name}${alias ? `, -${alias}` : ""}: [${type}${
          array === true ? "[]" : ""
        }] [${
          optional === true ||
            ("default" in options && options.default !== undefined)
            ? "optional"
            : "required"
        }]${choices ? ` [choices: ${choices.join(", ")}]` : ""}${
          "default" in options
            ? ` [default: ${
              Array.isArray(options.default)
                ? `[${options.default}]`
                : options.default
            }]`
            : ""
        }${description ? `\r\n      ${description}` : ""}`;
      },
    ).join("\r\n\r\n")
  }
    `;
};

export const getCommandListHelpText = (
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
