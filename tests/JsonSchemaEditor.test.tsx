import * as React from "react";
import * as ReactDOM from "react-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JsonSchemaEditor from "../src";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import { nestedSchema, propertyNames, typeInto } from "./helpers";

describe("React 19 harness", () => {
  // KAN-695 / KAN-679: the package peers react ^18 || ^19, but its own suite ran on
  // React 18 under react-scripts because @testing-library/react 10's cleanup called
  // ReactDOM.unmountComponentAtNode, which React 19 removed. These two assertions are
  // what make every other test in this repo evidence about React 19.
  it("runs against React 19", () => {
    expect(React.version.startsWith("19.")).toBe(true);
  });

  it("runs against a react-dom with the legacy render API removed", () => {
    const legacy = ReactDOM as unknown as Record<string, unknown>;
    expect(legacy.render).toBeUndefined();
    expect(legacy.unmountComponentAtNode).toBeUndefined();
  });
});

describe("JsonSchemaEditor — mounting", () => {
  it("renders the editor root", () => {
    render(<JsonSchemaEditor onSchemaChange={vi.fn()} />);
    expect(screen.getByTestId("jsonschema-editor")).toBeInTheDocument();
  });

  it("mounts with no props at all", () => {
    const { container } = render(<JsonSchemaEditor />);
    expect(container.querySelector('[data-testid="jsonschema-editor"]')).not.toBeNull();
  });

  it("starts from the default object schema and shows the empty-state button", () => {
    render(<JsonSchemaEditor onSchemaChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /add property/i })).toBeInTheDocument();
    expect(propertyNames()).toEqual([]);
  });
});

describe("JsonSchemaEditor — rendering a supplied schema", () => {
  it("renders every top-level property of a nested schema", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(propertyNames()).toEqual(expect.arrayContaining(["id", "tags", "info"]));
  });

  it("renders the nested object's own children", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    // `active` and `count` live inside `info`, so they only appear if the editor
    // recursed into the nested object.
    expect(propertyNames()).toEqual(
      expect.arrayContaining(["id", "tags", "info", "active", "count"])
    );
  });

  it("renders the array branch with its Items row", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    const items = screen
      .getAllByRole("textbox")
      .filter((el) => (el as HTMLInputElement).value === "Items");
    expect(items.length).toBeGreaterThan(0);
  });

  it("shows the root title and description", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Add Title")).toHaveValue("Item");
    expect(screen.getByPlaceholderText("Add Description")).toHaveValue(
      "The schema for item info."
    );
  });

  it("renders an array-typed root without an object property list", () => {
    render(
      <JsonSchemaEditor
        data={{ type: "array", items: { type: "string" } }}
        onSchemaChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("jsonschema-editor")).toBeInTheDocument();
    expect(propertyNames()).toEqual([]);
  });
});

describe("JsonSchemaEditor — onSchemaChange", () => {
  it("emits the schema as a JSON string on mount", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);

    await waitFor(() => expect(onSchemaChange).toHaveBeenCalled());
    const emitted = JSON.parse(onSchemaChange.mock.calls[0][0]) as JSONSchema7;
    expect(emitted.type).toBe("object");
    expect(Object.keys(emitted.properties ?? {})).toEqual(["id", "tags", "info"]);
  });

  it("re-emits after an edit, with the new value", async () => {
    const onSchemaChange = vi.fn();
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={onSchemaChange} />);
    await waitFor(() => expect(onSchemaChange).toHaveBeenCalled());
    const before = onSchemaChange.mock.calls.length;

    typeInto(screen.getByPlaceholderText("Add Title"), "Renamed root");

    await waitFor(() =>
      expect(onSchemaChange.mock.calls.length).toBeGreaterThan(before)
    );
    const latest = JSON.parse(
      onSchemaChange.mock.calls[onSchemaChange.mock.calls.length - 1][0]
    ) as JSONSchema7;
    expect(latest.title).toBe("Renamed root");
  });

  it("does not throw when no handler is supplied", async () => {
    expect(() => render(<JsonSchemaEditor data={nestedSchema()} />)).not.toThrow();
    await waitFor(() =>
      expect(screen.getByTestId("jsonschema-editor")).toBeInTheDocument()
    );
  });
});

describe("JsonSchemaEditor — readOnly", () => {
  it("disables the root title and description", () => {
    render(<JsonSchemaEditor data={nestedSchema()} readOnly onSchemaChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Add Title")).toBeDisabled();
    expect(screen.getByPlaceholderText("Add Description")).toBeDisabled();
  });

  it("disables every property name field", () => {
    render(<JsonSchemaEditor data={nestedSchema()} readOnly onSchemaChange={vi.fn()} />);
    for (const input of screen.getAllByPlaceholderText("Property name")) {
      expect(input).toBeDisabled();
    }
  });

  it("leaves those fields enabled when readOnly is not set", () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Add Title")).toBeEnabled();
    for (const input of screen.getAllByPlaceholderText("Property name")) {
      expect(input).toBeEnabled();
    }
  });
});

describe("JsonSchemaEditor — invalid schema", () => {
  const bad = { type: "notvalid", iwish: "doesnt matter" } as unknown as JSONSchema7;

  it("renders the Whoops illustration instead of the editor", () => {
    const { container } = render(
      <JsonSchemaEditor data={bad} onSchemaChange={vi.fn()} />
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByTestId("jsonschema-editor")).not.toBeInTheDocument();
  });

  it("renders the editor for the same shape once the type is valid", () => {
    render(
      <JsonSchemaEditor
        data={{ type: "object", properties: {} }}
        onSchemaChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("jsonschema-editor")).toBeInTheDocument();
  });
});
