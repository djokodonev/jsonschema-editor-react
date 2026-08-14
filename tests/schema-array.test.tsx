import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JsonSchemaEditor from "../src";
import { SchemaArray } from "../src/JsonSchemaEditor/schema-array";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import { iconButton, propertyNames, selectOption, typeInto } from "./helpers";

const arrayRoot = (items: JSONSchema7 | undefined): JSONSchema7 => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "array",
  title: "",
  description: "",
  items,
});

/** The Items row is the flex div holding the disabled input valued "Items". */
const itemsRow = (): HTMLElement => {
  const input = screen
    .getAllByRole("textbox")
    .find((el) => (el as HTMLInputElement).value === "Items");
  if (!input) throw new Error("no Items row rendered");
  return input.parentElement as HTMLElement;
};

describe("SchemaArray — rendering", () => {
  it("renders the Items row for an array root", () => {
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "", description: "" })}
        onSchemaChange={vi.fn()}
      />
    );
    expect(itemsRow()).toBeTruthy();
  });

  it("renders nothing when items is absent", () => {
    const { container } = render(
      <SchemaArray
        schema={{ type: "array" }}
        isReadOnly={false}
        updateSchema={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the items title and description", () => {
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "a tag", description: "one tag" })}
        onSchemaChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Title")).toHaveValue("a tag");
    expect(screen.getByPlaceholderText("Description")).toHaveValue("one tag");
  });

  it("uses the first entry when items is a tuple array", () => {
    render(
      <SchemaArray
        schema={{
          type: "array",
          items: [{ type: "boolean", title: "first" }, { type: "string" }],
        }}
        isReadOnly={false}
        updateSchema={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Title")).toHaveValue("first");
  });
});

describe("SchemaArray — editing items", () => {
  it("writes the items title into the schema", async () => {
    const updateSchema = vi.fn();
    render(
      <SchemaArray
        schema={{ type: "array", items: { type: "string", title: "", description: "" } }}
        isReadOnly={false}
        updateSchema={updateSchema}
      />
    );

    typeInto(screen.getByPlaceholderText("Title"), "a tag");

    await waitFor(() => expect(updateSchema).toHaveBeenCalled());
    const updater = updateSchema.mock.calls[0][0] as (s: JSONSchema7) => JSONSchema7;
    const next = updater({ type: "array", items: { type: "string" } });
    expect((next.items as JSONSchema7).title).toBe("a tag");
  });

  it("writes the items description into the schema", async () => {
    const updateSchema = vi.fn();
    render(
      <SchemaArray
        schema={{ type: "array", items: { type: "string", title: "", description: "" } }}
        isReadOnly={false}
        updateSchema={updateSchema}
      />
    );

    typeInto(screen.getByPlaceholderText("Description"), "one tag");

    await waitFor(() => expect(updateSchema).toHaveBeenCalled());
    const updater = updateSchema.mock.calls[0][0] as (s: JSONSchema7) => JSONSchema7;
    const next = updater({ type: "array", items: { type: "string" } });
    expect((next.items as JSONSchema7).description).toBe("one tag");
  });

  it("changes the items type through the select", async () => {
    const onSchemaChange = vi.fn();
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "", description: "" })}
        onSchemaChange={onSchemaChange}
      />
    );

    selectOption(itemsRow().querySelector(".ant-select-selector") as Element, "number");

    await waitFor(() => {
      const emitted = JSON.parse(
        onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
      ) as JSONSchema7;
      expect((emitted.items as JSONSchema7).type).toBe("number");
    });
  });

  it("disables the items type select in readOnly mode", () => {
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "", description: "" })}
        readOnly
        onSchemaChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Title")).toBeDisabled();
  });
});

describe("SchemaArray — arrays of objects", () => {
  const objectItems = (): JSONSchema7 =>
    arrayRoot({
      type: "object",
      title: "",
      description: "",
      properties: { existing: { type: "string", title: "", description: "" } },
      required: [],
    });

  it("renders the object items' properties", () => {
    render(<JsonSchemaEditor data={objectItems()} onSchemaChange={vi.fn()} />);
    expect(propertyNames()).toContain("existing");
  });

  it("adds a property to the object items schema", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={objectItems()} onSchemaChange={onSchemaChange} />);
    const before = propertyNames().length;

    fireEvent.click(iconButton(itemsRow(), "plus"));

    await waitFor(() => expect(propertyNames().length).toBe(before + 1));
    const emitted = JSON.parse(
      onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
    ) as JSONSchema7;
    expect(Object.keys((emitted.items as JSONSchema7).properties ?? {})).toHaveLength(2);
  });

  it("deletes a property from the object items schema", async () => {
    render(<JsonSchemaEditor data={objectItems()} onSchemaChange={vi.fn()} />);
    const row = screen
      .getAllByPlaceholderText("Property name")
      .find((el) => (el as HTMLInputElement).value === "existing")!
      .parentElement as HTMLElement;

    fireEvent.click(iconButton(row, "delete"));

    await waitFor(() => expect(propertyNames()).not.toContain("existing"));
  });
});

describe("SchemaArray — nested arrays", () => {
  const arrayOfArrays = (): JSONSchema7 =>
    arrayRoot({
      type: "array",
      title: "",
      description: "",
      items: { type: "string", title: "inner", description: "" },
    });

  it("recurses into an array of arrays", () => {
    render(<JsonSchemaEditor data={arrayOfArrays()} onSchemaChange={vi.fn()} />);
    const itemsInputs = screen
      .getAllByRole("textbox")
      .filter((el) => (el as HTMLInputElement).value === "Items");
    // One Items row for the outer array, one for the inner.
    expect(itemsInputs).toHaveLength(2);
  });

  it("routes an inner-array edit up through the outer array", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={arrayOfArrays()} onSchemaChange={onSchemaChange} />);

    // The inner array's title input is the second one on the page.
    const titles = screen.getAllByPlaceholderText("Title");
    typeInto(titles[titles.length - 1], "innermost");

    await waitFor(() => {
      const emitted = JSON.parse(
        onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
      ) as JSONSchema7;
      const outerItems = emitted.items as JSONSchema7;
      expect((outerItems.items as JSONSchema7).title).toBe("innermost");
    });
  });
});

describe("SchemaArray — advanced settings for items", () => {
  it("opens the array advanced modal for scalar items", async () => {
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "", description: "" })}
        onSchemaChange={vi.fn()}
      />
    );

    fireEvent.click(iconButton(itemsRow(), "setting"));

    await waitFor(() =>
      expect(screen.getByText("Advanced Array Schema Settings")).toBeInTheDocument()
    );
  });

  it("writes an advanced setting back onto the items schema", async () => {
    const onSchemaChange = vi.fn();
    render(
      <JsonSchemaEditor
        data={arrayRoot({ type: "string", title: "", description: "" })}
        onSchemaChange={onSchemaChange}
      />
    );
    fireEvent.click(iconButton(itemsRow(), "setting"));
    await waitFor(() => screen.getByText("Advanced Array Schema Settings"));

    typeInto(screen.getByPlaceholderText("Default value"), "fallback");

    await waitFor(() => {
      const emitted = JSON.parse(
        onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
      ) as JSONSchema7;
      expect((emitted.items as JSONSchema7).default).toBe("fallback");
    });
  });

  it("offers no advanced button for object items", () => {
    render(
      <JsonSchemaEditor
        data={arrayRoot({
          type: "object",
          title: "",
          description: "",
          properties: {},
          required: [],
        })}
        onSchemaChange={vi.fn()}
      />
    );
    expect(itemsRow().querySelector(".anticon-setting")).toBeNull();
  });
});
