import { z } from "zod";
import type { JsonSchema } from "../providers/types";

function isOptionalLike(schema: z.ZodTypeAny): boolean {
  return schema instanceof z.ZodOptional || schema instanceof z.ZodDefault;
}

/**
 * Converts a Zod schema into plain JSON Schema, used as the neutral representation for tool
 * parameters across all AI providers. Supports the subset of Zod actually used by SkyMind's
 * tool schemas (object/string/number/boolean/enum/array/literal + optional/nullable/default).
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  const description = schema.description;

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault) {
    const innerType = (schema._def as { innerType: z.ZodTypeAny }).innerType;
    const inner = zodToJsonSchema(innerType);
    return { ...inner, description: description ?? inner.description };
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value);
      if (!isOptionalLike(value)) required.push(key);
    }
    return { type: "object", description, properties, required: required.length > 0 ? required : undefined };
  }

  if (schema instanceof z.ZodArray) {
    return { type: "array", description, items: zodToJsonSchema(schema.element) };
  }

  if (schema instanceof z.ZodEnum) {
    return { type: "string", description, enum: schema.options as string[] };
  }

  if (schema instanceof z.ZodLiteral) {
    const value = schema.value as string | number;
    return { type: typeof value === "number" ? "number" : "string", description, enum: [value] };
  }

  if (schema instanceof z.ZodNumber) return { type: "number", description };
  if (schema instanceof z.ZodBoolean) return { type: "boolean", description };
  if (schema instanceof z.ZodString) return { type: "string", description };

  return { type: "string", description };
}
