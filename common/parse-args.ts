import { Args } from "https://deno.land/std@0.126.0/flags/mod.ts";
import { CLIType, CLITypes, IArgumentOptionsWithChoices } from "../types.ts";
import { typeValidators } from "./type-validators.ts";

export const parseArgs = <
  T extends Record<string, IArgumentOptionsWithChoices<CLIType>>,
>(
  rawArgs: Args,
  options: T,
) => {
  return (Object.keys(options)).reduce((result, key) => {
    const { choices, type, array, optional } = options[key];
    const rawVal = rawArgs[key];

    if (type === "boolean" && array) {
      throw new Error(`arrays not supported for boolean type`);
    }

    if (rawVal === undefined) {
      if (type === "boolean") {
        result[key] = false;
        return result;
      }

      if (optional === true) {
        return result;
      }

      throw new Error(
        `argument ${key} required: expected ${type}${array ? "[]" : ""}`,
      );
    }

    if (typeof rawVal === "boolean" && type !== "boolean") {
      throw new Error(
        `${key}: expected ${type}${array ? "[]" : ""}`,
      );
    }

    if (array) {
      result[key] = Array.isArray(rawVal)
        ? (rawVal).map((v) => typeValidators[type](v, key))
        : [typeValidators[type](rawVal, key)];
    } else {
      result[key] = typeValidators[type](
        rawVal,
        key,
      );
    }

    if (choices) {
      const val = result[key];

      if (Array.isArray(val)) {
        val.forEach((v, i) => {
          if (!choices.includes(v)) {
            throw new Error(
              `${key}: invalid value ${v} at index ${i}. valid choices: ${
                choices.join(", ")
              }`,
            );
          }
        });
      } else {
        if (!choices.includes(result[key] as CLITypes[CLIType])) {
          throw new Error(
            `${key}: invalid value ${result[key]}. valid choices: ${
              choices.join(", ")
            }`,
          );
        }
      }
    }

    return result;
  }, {} as Record<string, CLITypes[CLIType] | CLITypes[CLIType][] | undefined>);
};
