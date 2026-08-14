import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  defaultSchema,
  useSchemaStateReact,
} from "../src/JsonSchemaEditor/state/useSchemaStateReact";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";

describe("defaultSchema", () => {
  it("is a Draft 2020-12 object schema", () => {
    const schema = defaultSchema();
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.type).toBe("object");
    expect(schema.properties).toEqual({});
    expect(schema.required).toEqual([]);
  });

  it("returns a fresh object each call", () => {
    expect(defaultSchema()).not.toBe(defaultSchema());
  });
});

describe("useSchemaStateReact — ajv validation", () => {
  it("reports a well-formed schema as valid", () => {
    const { result } = renderHook(() => useSchemaStateReact(defaultSchema()));
    expect(result.current.isValidSchema).toBe(true);
  });

  it("reports a schema with a bogus type as invalid", () => {
    const bad = { type: "notvalid", iwish: "doesnt matter" } as unknown as JSONSchema7;
    const { result } = renderHook(() => useSchemaStateReact(bad));
    expect(result.current.isValidSchema).toBe(false);
  });

  it("re-validates after an update turns a good schema bad", () => {
    const { result } = renderHook(() => useSchemaStateReact(defaultSchema()));
    expect(result.current.isValidSchema).toBe(true);

    act(() => {
      result.current.updateSchema((prev) => ({
        ...prev,
        type: "notvalid" as unknown as JSONSchema7["type"],
      }));
    });

    expect(result.current.isValidSchema).toBe(false);
  });

  it("re-validates back to valid when the schema is repaired", () => {
    const bad = { type: "notvalid" } as unknown as JSONSchema7;
    const { result } = renderHook(() => useSchemaStateReact(bad));
    expect(result.current.isValidSchema).toBe(false);

    act(() => {
      result.current.setSchema(defaultSchema());
    });

    expect(result.current.isValidSchema).toBe(true);
  });

  it("accepts a schema with a nested object and array", () => {
    const nested: JSONSchema7 = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        info: {
          type: "object",
          properties: { active: { type: "boolean" } },
        },
      },
    };
    const { result } = renderHook(() => useSchemaStateReact(nested));
    expect(result.current.isValidSchema).toBe(true);
  });
});

describe("useSchemaStateReact — state transitions", () => {
  it("falls back to the default schema when given nothing", () => {
    const { result } = renderHook(() => useSchemaStateReact());
    expect(result.current.jsonSchema.type).toBe("object");
    expect(result.current.isValidSchema).toBe(true);
  });

  it("applies an updater against the previous schema", () => {
    const { result } = renderHook(() => useSchemaStateReact(defaultSchema()));

    act(() => {
      result.current.updateSchema((prev) => ({ ...prev, title: "first" }));
    });
    act(() => {
      result.current.updateSchema((prev) => ({
        ...prev,
        description: `${prev.title}-desc`,
      }));
    });

    expect(result.current.jsonSchema.title).toBe("first");
    expect(result.current.jsonSchema.description).toBe("first-desc");
  });

  it("replaces the schema wholesale via setSchema", () => {
    const { result } = renderHook(() => useSchemaStateReact(defaultSchema()));

    act(() => {
      result.current.setSchema({ type: "array", items: { type: "string" } });
    });

    expect(result.current.jsonSchema.type).toBe("array");
    expect(result.current.jsonSchema.properties).toBeUndefined();
  });

  it("defaults isReadOnly to false and echoes it back when set", () => {
    const { result: open } = renderHook(() => useSchemaStateReact(defaultSchema()));
    expect(open.current.isReadOnly).toBe(false);

    const { result: locked } = renderHook(() =>
      useSchemaStateReact(defaultSchema(), true)
    );
    expect(locked.current.isReadOnly).toBe(true);
  });

  it("keeps updateSchema and setSchema referentially stable across renders", () => {
    const { result, rerender } = renderHook(() =>
      useSchemaStateReact(defaultSchema())
    );
    const firstUpdate = result.current.updateSchema;
    const firstSet = result.current.setSchema;

    rerender();
    act(() => {
      result.current.updateSchema((prev) => ({ ...prev, title: "changed" }));
    });

    expect(result.current.updateSchema).toBe(firstUpdate);
    expect(result.current.setSchema).toBe(firstSet);
  });
});
