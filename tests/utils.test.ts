import { describe, expect, it } from "vitest";
import {
  DataType,
  SchemaTypes,
  StringFormat,
  deleteKey,
  getDefaultSchema,
  handleTypeChange,
  random,
  renameKeys,
} from "../src/JsonSchemaEditor/utils";

const DRAFT = "https://json-schema.org/draft/2020-12/schema";

describe("getDefaultSchema", () => {
  it.each([
    [DataType.string, "string"],
    [DataType.number, "number"],
    [DataType.integer, "integer"],
    [DataType.boolean, "boolean"],
    [DataType.object, "object"],
  ])("produces type %s", (dataType, expected) => {
    expect(getDefaultSchema(dataType).type).toBe(expected);
  });

  it("omits $schema unless includeSchema is set", () => {
    expect(getDefaultSchema(DataType.string).$schema).toBeUndefined();
    expect(getDefaultSchema(DataType.string, true).$schema).toBe(DRAFT);
  });

  it("gives objects an empty properties bag and required list", () => {
    const schema = getDefaultSchema(DataType.object);
    expect(schema.properties).toEqual({});
    expect(schema.required).toEqual([]);
  });

  it("gives arrays a string items schema and no required list", () => {
    const schema = getDefaultSchema(DataType.array);
    expect(schema.type).toBe("array");
    expect(schema.items).toEqual({ type: "string", title: "", description: "" });
    expect(schema.required).toBeUndefined();
  });

  it("falls back to string for an unrecognised data type", () => {
    expect(getDefaultSchema("nonsense" as DataType).type).toBe("string");
  });

  it("returns a fresh object each call so callers cannot alias state", () => {
    const a = getDefaultSchema(DataType.object);
    const b = getDefaultSchema(DataType.object);
    expect(a).not.toBe(b);
    (a.properties as Record<string, unknown>).injected = { type: "string" };
    expect(b.properties).toEqual({});
  });
});

describe("handleTypeChange", () => {
  it("maps each schema type to a matching default schema", () => {
    for (const type of ["string", "number", "integer", "boolean", "object"]) {
      expect(handleTypeChange(type as never, false).type).toBe(type);
    }
  });

  it("maps array to an array schema", () => {
    // DataType.array is deliberately spelled "arrray" in the enum, so the
    // array branch cannot go through the default lookup — it is special-cased.
    expect(handleTypeChange("array", false).type).toBe("array");
  });

  it("adds $schema only on a root change", () => {
    expect(handleTypeChange("object", true).$schema).toBe(DRAFT);
    expect(handleTypeChange("object", false).$schema).toBeUndefined();
    expect(handleTypeChange("array", true).$schema).toBe(DRAFT);
  });
});

describe("renameKeys", () => {
  it("renames only the mapped keys and preserves the rest", () => {
    expect(renameKeys({ a: "z" }, { a: 1, b: 2 })).toEqual({ z: 1, b: 2 });
  });

  it("is a no-op when nothing matches", () => {
    expect(renameKeys({ missing: "x" }, { a: 1 })).toEqual({ a: 1 });
  });

  it("does not mutate the source object", () => {
    const source = { a: 1 };
    renameKeys({ a: "z" }, source);
    expect(source).toEqual({ a: 1 });
  });

  it("is curried", () => {
    const rename = renameKeys({ old: "new" });
    expect(rename({ old: true })).toEqual({ new: true });
  });
});

describe("deleteKey", () => {
  it("removes the key and returns the same object reference", () => {
    const target = { a: 1, b: 2 };
    const result = deleteKey("a", target);
    expect(result).toBe(target);
    expect(result).toEqual({ b: 2 });
  });

  it("tolerates a key that is not present", () => {
    expect(deleteKey("nope", { a: 1 })).toEqual({ a: 1 });
  });
});

describe("random", () => {
  it("returns a short alphanumeric suffix", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(random()).toMatch(/^[0-9a-z]{1,4}$/);
    }
  });

  it("is not constant across calls", () => {
    const seen = new Set(Array.from({ length: 50 }, () => random()));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("exported vocabularies", () => {
  it("offers every editable schema type", () => {
    expect(SchemaTypes).toEqual([
      "string",
      "number",
      "array",
      "object",
      "boolean",
      "integer",
    ]);
  });

  it("offers the draft string formats the advanced editor renders", () => {
    expect(StringFormat.map((f) => f.name)).toEqual([
      "date-time",
      "date",
      "time",
      "email",
      "hostname",
      "ipv4",
      "ipv6",
      "uri",
      "regex",
    ]);
  });
});
