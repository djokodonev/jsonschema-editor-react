import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JsonSchemaEditor from "../src";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import {
  iconButton,
  nestedSchema,
  propertyNames,
  requiredCheckbox,
  rowFor,
  selectOption,
  selectorIn,
  typeInto,
} from "./helpers";

/** Latest schema emitted through onSchemaChange. */
const latest = (spy: ReturnType<typeof vi.fn>): JSONSchema7 =>
  JSON.parse(spy.mock.calls[spy.mock.calls.length - 1][0]);

describe("adding properties", () => {
  it("adds the first property from the empty state", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor onSchemaChange={onSchemaChange} />);
    expect(propertyNames()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: /add property/i }));

    await waitFor(() => expect(propertyNames()).toHaveLength(1));
    expect(propertyNames()[0]).toMatch(/^field_/);
    expect(Object.keys(latest(onSchemaChange).properties ?? {})).toHaveLength(1);
  });

  it("adds a sibling from the root plus button", async () => {
    const onSchemaChange = vi.fn();
    const { container } = render(
      <JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />
    );
    const before = propertyNames().length;

    const root = container.querySelector('[data-testid="jsonschema-editor"]') as HTMLElement;
    fireEvent.click(iconButton(root, "plus"));

    await waitFor(() => expect(propertyNames().length).toBe(before + 1));
  });

  it("gives the new property a string default schema", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor onSchemaChange={onSchemaChange} />);
    fireEvent.click(screen.getByRole("button", { name: /add property/i }));

    await waitFor(() => expect(propertyNames()).toHaveLength(1));
    const props = latest(onSchemaChange).properties ?? {};
    const added = Object.values(props)[0] as JSONSchema7;
    expect(added.type).toBe("string");
  });

  it("adds a sibling from an existing row's plus button", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    const before = propertyNames().length;

    fireEvent.click(iconButton(rowFor("id"), "plus"));

    await waitFor(() => expect(propertyNames().length).toBe(before + 1));
  });
});

describe("deleting properties", () => {
  it("removes the row and the schema entry", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);
    expect(propertyNames()).toContain("id");

    fireEvent.click(iconButton(rowFor("id"), "delete"));

    await waitFor(() => expect(propertyNames()).not.toContain("id"));
    expect(latest(onSchemaChange).properties).not.toHaveProperty("id");
  });

  it("drops the name from required as well", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);
    await waitFor(() => expect(onSchemaChange).toHaveBeenCalled());
    expect(latest(onSchemaChange).required).toContain("id");

    fireEvent.click(iconButton(rowFor("id"), "delete"));

    await waitFor(() => expect(latest(onSchemaChange).required).not.toContain("id"));
  });

  it("returns to the empty state when the last property goes", async () => {
    render(
      <JsonSchemaEditor
        data={{ type: "object", properties: { only: { type: "string" } }, required: [] }}
        onSchemaChange={vi.fn()}
      />
    );

    fireEvent.click(iconButton(rowFor("only"), "delete"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add property/i })).toBeInTheDocument()
    );
  });

  it("leaves sibling properties untouched", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    fireEvent.click(iconButton(rowFor("id"), "delete"));

    await waitFor(() => expect(propertyNames()).not.toContain("id"));
    expect(propertyNames()).toEqual(expect.arrayContaining(["tags", "info"]));
  });
});

describe("renaming properties", () => {
  it("renames after the debounce elapses", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    typeInto(rowFor("id").querySelector("input") as Element, "identifier");

    await waitFor(
      () => expect(latest(onSchemaChange).properties).toHaveProperty("identifier"),
      { timeout: 3000 }
    );
    expect(latest(onSchemaChange).properties).not.toHaveProperty("id");
  });

  it("carries the rename through the required list", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    typeInto(rowFor("id").querySelector("input") as Element, "identifier");

    await waitFor(() => expect(latest(onSchemaChange).required).toContain("identifier"), {
      timeout: 3000,
    });
    expect(latest(onSchemaChange).required).not.toContain("id");
  });

  it("refuses a rename that collides with an existing property", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    typeInto(rowFor("id").querySelector("input") as Element, "tags");

    await waitFor(
      () => expect(document.body.textContent).toContain("already exists"),
      { timeout: 3000 }
    );
    // The original key survives and no duplicate is created.
    const props = latest(onSchemaChange).properties ?? {};
    expect(props).toHaveProperty("id");
    expect(Object.keys(props).filter((k) => k === "tags")).toHaveLength(1);
  });

  it("does not emit a rename before the debounce fires", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);
    await waitFor(() => expect(onSchemaChange).toHaveBeenCalled());

    typeInto(rowFor("id").querySelector("input") as Element, "identifier");

    // Immediately after typing the schema still has the old key.
    expect(latest(onSchemaChange).properties).toHaveProperty("id");
  });
});

describe("required toggling", () => {
  it("shows required state from the schema", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(requiredCheckbox(rowFor("id"))).toBeChecked();
    expect(requiredCheckbox(rowFor("tags"))).not.toBeChecked();
  });

  it("adds a property to required when checked", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    fireEvent.click(requiredCheckbox(rowFor("tags")));

    await waitFor(() => expect(latest(onSchemaChange).required).toContain("tags"));
  });

  it("removes a property from required when unchecked", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    fireEvent.click(requiredCheckbox(rowFor("id")));

    await waitFor(() => expect(latest(onSchemaChange).required).not.toContain("id"));
  });

  it("toggles the nested object's own required list, not the root's", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    fireEvent.click(requiredCheckbox(rowFor("count")));

    await waitFor(() => {
      const info = (latest(onSchemaChange).properties ?? {}).info as JSONSchema7;
      expect(info.required).toContain("count");
    });
    expect(latest(onSchemaChange).required).not.toContain("count");
  });
});

describe("editing titles and descriptions", () => {
  it("writes a property title into the schema", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    const title = rowFor("id").querySelector('input[placeholder="Title"]') as Element;
    typeInto(title, "The identifier");

    await waitFor(() => {
      const id = (latest(onSchemaChange).properties ?? {}).id as JSONSchema7;
      expect(id.title).toBe("The identifier");
    });
  });

  it("writes a property description into the schema", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    const desc = rowFor("id").querySelector(
      'input[placeholder="Description"]'
    ) as Element;
    typeInto(desc, "Primary key");

    await waitFor(() => {
      const id = (latest(onSchemaChange).properties ?? {}).id as JSONSchema7;
      expect(id.description).toBe("Primary key");
    });
  });
});

describe("changing a property's type", () => {
  it("switches a string property to number", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    selectOption(selectorIn(rowFor("id")), "number");

    await waitFor(() => {
      const id = (latest(onSchemaChange).properties ?? {}).id as JSONSchema7;
      expect(id.type).toBe("number");
    });
  });

  it("replaces the property schema wholesale, dropping the old title", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    selectOption(selectorIn(rowFor("id")), "boolean");

    await waitFor(() => {
      const id = (latest(onSchemaChange).properties ?? {}).id as JSONSchema7;
      expect(id.type).toBe("boolean");
      // handleTypeChange returns a fresh default schema — the previous
      // title ("identifier") does not survive a type switch.
      expect(id.title).toBe("");
    });
  });

  it("switching to object renders a nested empty-state add button", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    // Every object in the fixture already has properties, so there is no
    // empty-state button until `id` becomes an empty object.
    const before = screen.queryAllByRole("button", { name: /add property/i }).length;

    selectOption(selectorIn(rowFor("id")), "object");

    await waitFor(() =>
      expect(screen.queryAllByRole("button", { name: /add property/i }).length).toBe(
        before + 1
      )
    );
  });
});
