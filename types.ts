export interface IBuilder {
  command: <A extends CommandArgs>(
    name: string,
    options: ICommand<A>,
  ) => IBuilder;
  list: (name: string, options: ICommandList) => void;
}

export type CommandArgs = {
  [key: string]: IArgumentOptions<CLIType>;
};

export interface ICommand<
  A extends CommandArgs,
> {
  args: A;
  run: (args: ParsedArgumentType<A>) => void;
  description: string;
}

export interface ICommandList {
  description: string;
  commands: (builder: IBuilder) => IBuilder | void;
}

export interface CLITypes {
  "string": string;
  "integer": number;
  "boolean": boolean;
  "number": number;
}

export type CLIType = keyof CLITypes;

export interface IArgumentOptions<T extends CLIType> {
  type: T;
  array?: boolean;
  optional?: boolean;
  description?: string;
}

export type ArrayOrSingleFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
> = T extends { array: true } ? CLITypes[T["type"]][] : CLITypes[T["type"]];

export type OptionalityFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
> = T extends { optional: true }
  ? ArrayOrSingleFromArgumentOptions<T> | undefined
  : ArrayOrSingleFromArgumentOptions<T>;

export type TypeFromArgumentOptions<T extends IArgumentOptions<CLIType>> =
  OptionalityFromArgumentOptions<T>;

export type ParsedArgumentType<
  A extends CommandArgs,
> = { [P in keyof A]: TypeFromArgumentOptions<A[P]> };
