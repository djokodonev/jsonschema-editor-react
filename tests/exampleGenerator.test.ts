import { afterEach, describe, expect, it, vi } from "vitest";
import { generateExample } from "../src/JsonSchemaEditor/utils/exampleGenerator";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateExample — keyword precedence", () => {
  it("prefers enum over const, default and type", () => {
    const schema: JSONSchema7 = {
      type: "string",
      enum: ["first", "second"],
      const: "the-const",
      default: "the-default",
    };
    expect(generateExample(schema)).toBe("first");
  });

  it("prefers const over default and type", () => {
    expect(
      generateExample({ type: "string", const: "C", default: "D" })
    ).toBe("C");
  });

  it("prefers default over type", () => {
    expect(generateExample({ type: "string", default: "D" })).toBe("D");
  });

  it("honours a falsy const rather than falling through to default", () => {
    // `schema.const !== undefined` — 0 and false are legal consts and must win.
    expect(generateExample({ type: "number", const: 0, default: 99 })).toBe(0);
    expect(generateExample({ type: "boolean", const: false })).toBe(false);
  });

  it("ignores an empty enum and falls through", () => {
    expect(generateExample({ type: "string", enum: [] })).toBe("string");
  });
});

describe("generateExample — strings", () => {
  it.each([
    ["date", "2024-01-01"],
    ["date-time", "2024-01-01T00:00:00Z"],
    ["email", "example@email.com"],
    ["uri", "https://example.com"],
  ])("maps format %s to %s", (format, expected) => {
    expect(generateExample({ type: "string", format })).toBe(expected);
  });

  it("pads to minLength when no format is set", () => {
    expect(generateExample({ type: "string", minLength: 5 })).toBe("aaaaa");
  });

  it("lets format win over minLength", () => {
    expect(
      generateExample({ type: "string", format: "email", minLength: 40 })
    ).toBe("example@email.com");
  });

  it("falls back to the literal 'string'", () => {
    expect(generateExample({ type: "string" })).toBe("string");
  });

  it("ignores an unrecognised format", () => {
    expect(generateExample({ type: "string", format: "uuid" })).toBe("string");
  });
});

describe("generateExample — numbers and integers", () => {
  it("returns minimum when present", () => {
    expect(generateExample({ type: "number", minimum: 7 })).toBe(7);
    expect(generateExample({ type: "integer", minimum: 7 })).toBe(7);
  });

  it("returns half of maximum when only maximum is present", () => {
    expect(generateExample({ type: "number", maximum: 9 })).toBe(4.5);
  });

  it("floors half of maximum for integers", () => {
    expect(generateExample({ type: "integer", maximum: 9 })).toBe(4);
  });

  it("prefers minimum over maximum", () => {
    expect(generateExample({ type: "number", minimum: 2, maximum: 100 })).toBe(2);
  });

  it("defaults to 0", () => {
    expect(generateExample({ type: "number" })).toBe(0);
    expect(generateExample({ type: "integer" })).toBe(0);
  });

  it("treats minimum 0 as present rather than falsy", () => {
    expect(generateExample({ type: "number", minimum: 0, maximum: 50 })).toBe(0);
  });
});

describe("generateExample — booleans, null and unknowns", () => {
  it("returns true for boolean", () => {
    expect(generateExample({ type: "boolean" })).toBe(true);
  });

  it("returns null for the null type", () => {
    expect(generateExample({ type: "null" })).toBeNull();
  });

  it("returns null for a schema with no type", () => {
    expect(generateExample({ title: "untyped" })).toBeNull();
  });

  it("returns null for a missing schema", () => {
    expect(generateExample(undefined as unknown as JSONSchema7)).toBeNull();
  });

  it("uses the first entry of a union type", () => {
    expect(generateExample({ type: ["boolean", "string"] })).toBe(true);
  });
});

describe("generateExample — arrays", () => {
  it("returns an empty array when items is absent", () => {
    expect(generateExample({ type: "array" })).toEqual([]);
  });

  it("fills one element by default", () => {
    expect(generateExample({ type: "array", items: { type: "string" } })).toEqual([
      "string",
    ]);
  });

  it("fills minItems elements", () => {
    expect(
      generateExample({ type: "array", minItems: 3, items: { type: "boolean" } })
    ).toEqual([true, true, true]);
  });

  it("uses the first schema of a tuple-style items array", () => {
    expect(
      generateExample({
        type: "array",
        items: [{ type: "integer", minimum: 42 }, { type: "string" }],
      })
    ).toEqual([42]);
  });

  it("nests arrays of objects", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(
      generateExample({
        type: "array",
        items: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      })
    ).toEqual([{ id: "string" }]);
  });
});

describe("generateExample — objects", () => {
  const schema: JSONSchema7 = {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      optional: { type: "boolean" },
    },
  };

  it("always includes required properties", () => {
    // 0.1 is below the 0.3 gate, so every optional property is dropped.
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(generateExample(schema)).toEqual({ id: "string" });
  });

  it("includes optional properties when the gate passes", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(generateExample(schema)).toEqual({ id: "string", optional: true });
  });

  it("returns an empty object when there are no properties", () => {
    expect(generateExample({ type: "object" })).toEqual({});
  });

  it("recurses through nested objects", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(
      generateExample({
        type: "object",
        required: ["inner"],
        properties: {
          inner: {
            type: "object",
            required: ["when"],
            properties: { when: { type: "string", format: "date" } },
          },
        },
      })
    ).toEqual({ inner: { when: "2024-01-01" } });
  });

  it("treats a required property as required even with the gate closed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const out = generateExample({
      type: "object",
      required: ["a", "b"],
      properties: {
        a: { type: "string" },
        b: { type: "number", minimum: 5 },
        c: { type: "string" },
      },
    });
    expect(out).toEqual({ a: "string", b: 5 });
    expect(out).not.toHaveProperty("c");
  });
});
