import {
  CLIType,
  IArgumentOptionsWithChoices,
  IArgumentsBuilder,
  ICommand,
  ICommandList,
} from "../types.ts";
import { getListCommands } from "./list-commands.ts";

export const getCommandHelpText = (name: string, command: ICommand) => {
  const args = new Array<
    IArgumentOptionsWithChoices<CLIType> & {
      name: string;
    }
  >();

  const builder = {
    add: (name, options, choices) => {
      args.push({
        ...options,
        name,
        choices,
      });
      return builder;
    },
    run: () => null,
  } as IArgumentsBuilder;

  command.args(builder);

  return `
USAGE: ${name} [OPTIONS]
${command.description ? `\r\n${command.description}\r\n` : ""}
OPTIONS:
  
${
    args.map(
      ({ name, type, array, optional, description, choices, alias }) => {
        return `  --${name}${alias ? `, -${alias}` : ""}: [${type}${
          array === true ? "[]" : ""
        }] [${optional === true ? "optional" : "required"}]${
          choices ? ` [choices: ${choices.join(", ")}]` : ""
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
