import { z } from "zod";
import { describe, expect, it } from "vitest";
import { zodToJsonSchema } from "./zodToJsonSchema";

describe("zodToJsonSchema", () => {
  it("converts primitive types", () => {
    expect(zodToJsonSchema(z.string())).toEqual({ type: "string", description: undefined });
    expect(zodToJsonSchema(z.number())).toEqual({ type: "number", description: undefined });
    expect(zodToJsonSchema(z.boolean())).toEqual({ type: "boolean", description: undefined });
  });

  it("converts an object, marking non-optional fields as required", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });
    const result = zodToJsonSchema(schema);
    expect(result.type).toBe("object");
    expect(result.required).toEqual(["name"]);
    expect(result.properties?.name).toEqual({ type: "string", description: undefined });
  });

  it("converts enums to a string type with enum values", () => {
    const result = zodToJsonSchema(z.enum(["a", "b", "c"]));
    expect(result).toEqual({ type: "string", description: undefined, enum: ["a", "b", "c"] });
  });

  it("converts arrays with an items schema", () => {
    const result = zodToJsonSchema(z.array(z.string()));
    expect(result.type).toBe("array");
    expect(result.items).toEqual({ type: "string", description: undefined });
  });

  it("preserves descriptions through optional wrappers", () => {
    const result = zodToJsonSchema(z.string().describe("An item ID").optional());
    expect(result.description).toBe("An item ID");
  });

  it("unwraps default values to the inner type", () => {
    const result = zodToJsonSchema(z.boolean().default(true));
    expect(result.type).toBe("boolean");
  });
});
