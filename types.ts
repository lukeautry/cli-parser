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

export type IArgumentsBuilder<T = Record<never, never>> = {
  add: <
    N extends string,
    K extends CLIType,
    O extends IArgumentOptions<K>,
    C extends CLITypes[O["type"]],
  >(
    name: N,
    options: O,
    choices?: ReadonlyArray<C>,
  ) => IArgumentsBuilder<
    & T
    & {
      [P in N]: typeof choices extends undefined
        ? TypeFromArgumentOptions<O, CLITypes[K]>
        : TypeFromArgumentOptions<O, C>;
    }
  >;
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
  type: T;
  alias?: string;
  array?: boolean;
  optional?: boolean;
  description?: string;
}

export interface IArgumentOptionsWithChoices<T extends CLIType>
  extends IArgumentOptions<T> {
  choices?: ReadonlyArray<CLITypes[T]>;
}

export type ArrayOrSingleFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
  V,
> = T extends { array: true } ? V[] : V;

export type OptionalityFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
  V,
> = T extends { optional: true }
  ? ArrayOrSingleFromArgumentOptions<T, V> | undefined
  : ArrayOrSingleFromArgumentOptions<T, V>;

export type TypeFromArgumentOptions<
  T extends IArgumentOptions<CLIType>,
  V,
> = OptionalityFromArgumentOptions<T, V>;

export type ParsedArgumentType<
  A extends Record<string, IArgumentOptions<CLIType>>,
  V,
> = { [P in keyof A]: TypeFromArgumentOptions<A[P], V> };
