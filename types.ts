interface IBaseBuilder<T> {
  command: (name: string, options: ICommand) => T;
  list: (name: string, options: ICommandList) => T;
}

export type IRootBuilder = IBaseBuilder<void>;

export type IBuilder = IBaseBuilder<IBuilder>;

export interface ICommand {
  description: string;
  args: (a: IArgumentsBuilder<Record<never, never>>) => null;
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

export interface IBaseArgumentsBuilderAddOptions<
  N extends string,
  K extends CLIType,
  C extends CLITypes[K],
  IsArray extends boolean,
  IsOptional extends boolean,
> {
  name: N;
  type: K;
  description?: string;
  alias?: string;
  array?: IsArray;
  choices?: ReadonlyArray<C>;
  optional?: IsOptional;
}

export interface IArgumentsBuilderAddOptionsWithDefault<
  N extends string,
  K extends CLIType,
  C extends CLITypes[K],
  Default extends C,
  IsArray extends boolean,
  IsOptional extends boolean,
> extends IBaseArgumentsBuilderAddOptions<N, K, C, IsArray, IsOptional> {
  default: IsArray extends true ? Default[] : Default;
}

export type ArgumentOptions<
  N extends string,
  K extends CLIType,
  C extends CLITypes[K],
  Default extends C,
  IsOptional extends boolean = false,
  IsArray extends boolean = false,
> =
  | IBaseArgumentsBuilderAddOptions<N, K, C, IsArray, IsOptional>
  | IArgumentsBuilderAddOptionsWithDefault<
    N,
    K,
    C,
    Default,
    IsArray,
    false
  >;

export type IArgumentsBuilder<T> = {
  add: <
    N extends string,
    K extends CLIType,
    C extends CLITypes[K],
    Default extends C,
    IsOptional extends boolean = false,
    IsArray extends boolean = false,
  >(
    options: ArgumentOptions<N, K, C, Default, IsOptional, IsArray>,
  ) => IArgumentsBuilder<
    & T
    & {
      [P in N]: TypeFromOptions<
        K,
        C,
        IsOptional,
        IsArray
      >;
    }
  >;
  run: (fn: (args: T) => void) => null;
};

export type ArrayOrSingleFromOptions<
  K extends CLIType,
  C extends CLITypes[K],
  IsArray extends boolean,
> = IsArray extends true ? C[] : C;

export type TypeFromOptions<
  K extends CLIType,
  C extends CLITypes[K],
  IsOptional extends boolean,
  IsArray extends boolean,
> = IsOptional extends true ? 
  | ArrayOrSingleFromOptions<K, C, IsArray>
  | undefined
  : ArrayOrSingleFromOptions<K, C, IsArray>;
