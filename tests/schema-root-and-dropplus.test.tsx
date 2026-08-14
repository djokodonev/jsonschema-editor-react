import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SchemaRoot } from "../src/JsonSchemaEditor/schema-root";
import { DropPlus } from "../src/JsonSchemaEditor/drop-plus";
import JsonSchemaEditor from "../src";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import { iconButton, nestedSchema, propertyNames, rowFor, typeInto } from "./helpers";

const objectSchema: JSONSchema7 = {
  type: "object",
  title: "",
  description: "",
  properties: {},
  required: [],
};

const applied = (
  updateSchema: ReturnType<typeof vi.fn>,
  base: JSONSchema7
): JSONSchema7 => {
  const updater = updateSchema.mock.calls[updateSchema.mock.calls.length - 1][0] as (
    s: JSONSchema7
  ) => JSONSchema7;
  return updater(base);
};

describe("SchemaRoot", () => {
  it("writes the root title", async () => {
    const updateSchema = vi.fn();
    render(
      <SchemaRoot
        schema={objectSchema}
        isReadOnly={false}
        updateSchema={updateSchema}
      />
    );

    typeInto(screen.getByPlaceholderText("Add Title"), "My schema");

    await waitFor(() => expect(updateSchema).toHaveBeenCalled());
    expect(applied(updateSchema, objectSchema).title).toBe("My schema");
  });

  it("writes the root description", async () => {
    const updateSchema = vi.fn();
    render(
      <SchemaRoot
        schema={objectSchema}
        isReadOnly={false}
        updateSchema={updateSchema}
      />
    );

    typeInto(screen.getByPlaceholderText("Add Description"), "what it holds");

    await waitFor(() => expect(updateSchema).toHaveBeenCalled());
    expect(applied(updateSchema, objectSchema).description).toBe("what it holds");
  });

  it("adds a property with a generated field name", async () => {
    const updateSchema = vi.fn();
    const { container } = render(
      <SchemaRoot
        schema={objectSchema}
        isReadOnly={false}
        updateSchema={updateSchema}
      />
    );

    fireEvent.click(iconButton(container, "plus"));

    await waitFor(() => expect(updateSchema).toHaveBeenCalled());
    const keys = Object.keys(applied(updateSchema, objectSchema).properties ?? {});
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^field_[0-9a-z]{1,4}$/);
  });

  it("hides the add button for a non-object root", () => {
    const { container } = render(
      <SchemaRoot
        schema={{ type: "array", items: { type: "string" } }}
        isReadOnly={false}
        updateSchema={vi.fn()}
      />
    );
    expect(container.querySelector(".anticon-plus")).toBeNull();
  });

  it("shows the Preview button only when onPreview is supplied", () => {
    const { unmount } = render(
      <SchemaRoot schema={objectSchema} isReadOnly={false} updateSchema={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: /preview/i })).not.toBeInTheDocument();
    unmount();

    render(
      <SchemaRoot
        schema={objectSchema}
        isReadOnly={false}
        updateSchema={vi.fn()}
        onPreview={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
  });

  it("calls onPreview when the Preview button is clicked", () => {
    const onPreview = vi.fn();
    render(
      <SchemaRoot
        schema={objectSchema}
        isReadOnly={false}
        updateSchema={vi.fn()}
        onPreview={onPreview}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /preview/i }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("disables the add button in readOnly mode", () => {
    const { container } = render(
      <SchemaRoot schema={objectSchema} isReadOnly updateSchema={vi.fn()} />
    );
    expect(iconButton(container, "plus")).toBeDisabled();
  });
});

describe("DropPlus", () => {
  const props = {
    item: { type: "object" } as JSONSchema7,
    parentSchema: objectSchema,
    onAddSibling: vi.fn(),
    onAddChild: vi.fn(),
  };

  it("renders nothing when disabled", () => {
    const { container } = render(<DropPlus {...props} isDisabled />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens a popover offering sibling and child", async () => {
    const { container } = render(<DropPlus {...props} isDisabled={false} />);

    fireEvent.click(iconButton(container, "plus"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add Sibling" })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Add Child" })).toBeInTheDocument();
  });

  it("calls onAddSibling and closes", async () => {
    const onAddSibling = vi.fn();
    const { container } = render(
      <DropPlus {...props} isDisabled={false} onAddSibling={onAddSibling} />
    );
    fireEvent.click(iconButton(container, "plus"));

    await waitFor(() => screen.getByRole("button", { name: "Add Sibling" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Sibling" }));

    expect(onAddSibling).toHaveBeenCalledTimes(1);
  });

  it("closes without acting when Cancel is pressed", async () => {
    const onAddSibling = vi.fn();
    const onAddChild = vi.fn();
    const { container } = render(
      <DropPlus
        {...props}
        isDisabled={false}
        onAddSibling={onAddSibling}
        onAddChild={onAddChild}
      />
    );
    fireEvent.click(iconButton(container, "plus"));
    await waitFor(() => screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAddSibling).not.toHaveBeenCalled();
    expect(onAddChild).not.toHaveBeenCalled();
  });

  it("calls onAddChild", async () => {
    const onAddChild = vi.fn();
    const { container } = render(
      <DropPlus {...props} isDisabled={false} onAddChild={onAddChild} />
    );
    fireEvent.click(iconButton(container, "plus"));

    await waitFor(() => screen.getByRole("button", { name: "Add Child" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Child" }));

    expect(onAddChild).toHaveBeenCalledTimes(1);
  });
});

describe("adding a child to a nested object, end to end", () => {
  it("adds the new field inside the parent object, not at the root", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);
    const before = propertyNames().length;

    // `info` is an object, so its row renders DropPlus rather than a plain +.
    fireEvent.click(iconButton(rowFor("info"), "plus"));
    await waitFor(() => screen.getByRole("button", { name: "Add Child" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Child" }));

    await waitFor(() => expect(propertyNames().length).toBe(before + 1));
    const emitted = JSON.parse(
      onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
    ) as JSONSchema7;
    const info = (emitted.properties ?? {}).info as JSONSchema7;
    expect(Object.keys(info.properties ?? {})).toHaveLength(3);
    expect(Object.keys(emitted.properties ?? {})).toHaveLength(3);
  });
});

describe("advanced settings modal from a property row", () => {
  it("opens for a scalar property", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);

    fireEvent.click(iconButton(rowFor("id"), "setting"));

    await waitFor(() =>
      expect(screen.getByText("Advanced Schema Settings")).toBeInTheDocument()
    );
    expect(screen.getByText("Min Length")).toBeInTheDocument();
  });

  it("is not offered for object or array properties", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(rowFor("info").querySelector(".anticon-setting")).toBeNull();
    expect(rowFor("tags").querySelector(".anticon-setting")).toBeNull();
  });
});
