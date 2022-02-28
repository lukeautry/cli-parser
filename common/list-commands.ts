import { IBuilder, ICommand, ICommandList } from "../types.ts";

export const getListCommands = (list: ICommandList) => {
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
