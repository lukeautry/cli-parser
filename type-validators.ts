import { CLIType, CLITypes } from "./types.ts";

/**
 * This isn't meant to be an exhaustive parser for the included types.
 * It should merely validate known value types provided by Deno flag parser.
 */
export const typeValidators: {
  [P in CLIType]: (
    val: unknown,
    field: string,
  ) => CLITypes[P];
} = {
  string: (val, field) => {
    if (typeof val === "string") {
      return val;
    }

    if (typeof val === "number") {
      return val.toString();
    }

    throw new Error(`${field}: expected string`);
  },
  integer: (val, field) => {
    if (typeof val === "number" && Number.isInteger(val)) {
      return val;
    }

    throw new Error(`${field}: expected integer`);
  },
  number: (val, field) => {
    if (typeof val === "number") {
      return val;
    }

    throw new Error(`${field}: expected number`);
  },
  boolean: (val) => {
    return val === true;
  },
};
