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

export type CommandArgs = Record<string, IArgumentOptions<CLIType>>;

export interface ITerminalCommand<
  A extends CommandArgs,
> {
  type: "command";
  args: A;
  run: (args: ParsedArgumentType<A>) => void;
  description: string;
}

export interface ICommandList<A extends CommandArgs> {
  type: "command-list";
  commands: Record<string, ICommandLike<A>>;
  description: string;
}

export type ICommandLike<A extends CommandArgs> =
  | ITerminalCommand<A>
  | ICommandList<A>;

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
