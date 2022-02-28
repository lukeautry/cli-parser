export interface IBuilder {
  command: (
    name: string,
    options: ICommand,
  ) => IBuilder;
  list: (name: string, options: ICommandList) => void;
}

export interface ICommand {
  description: string;
  args: (a: IArgumentsBuilder) => null;
}

// deno-lint-ignore ban-types
export type IArgumentsBuilder<T = {}> = {
  add: <N extends string, K extends CLIType, O extends IArgumentOptions<K>>(
    name: N,
    options: O,
  ) => IArgumentsBuilder<T & { [P in N]: TypeFromArgumentOptions<O> }>;
  run: (fn: (args: T) => void) => null;
};

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
  readonly type: T;
  readonly array?: boolean;
  readonly optional?: boolean;
  readonly description?: string;
}

export type ArrayOrSingleFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
> = T extends { array: true } ? CLITypes[T["type"]][] : CLITypes[T["type"]];

export type OptionalityFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
> = T extends { optional: true }
  ? ArrayOrSingleFromArgumentOptions<T> | undefined
  : ArrayOrSingleFromArgumentOptions<T>;

export type TypeFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
> = OptionalityFromArgumentOptions<T>;

export type ParsedArgumentType<
  A extends Record<string, IArgumentOptions<CLIType>>,
> = { [P in keyof A]: TypeFromArgumentOptions<A[P]> };
