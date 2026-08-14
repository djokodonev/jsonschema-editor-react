import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JsonSchemaEditor from "../src";
import { SchemaPreview } from "../src/JsonSchemaEditor/schema-preview";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import { nestedSchema } from "./helpers";

const simple: JSONSchema7 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["id"],
  properties: { id: { type: "string" } },
};

describe("SchemaPreview — visibility", () => {
  it("renders nothing while closed", () => {
    render(<SchemaPreview schema={simple} open={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Schema Preview")).not.toBeInTheDocument();
  });

  it("renders the modal when open", () => {
    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    expect(screen.getByText("Schema Preview")).toBeInTheDocument();
  });

  it("offers both tabs", () => {
    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "JSON Schema" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Example JSON" })).toBeInTheDocument();
  });

  it("calls onClose from the modal close button", () => {
    const onClose = vi.fn();
    render(<SchemaPreview schema={simple} open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SchemaPreview — schema tab", () => {
  it("pretty-prints the schema", () => {
    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    const pre = document.querySelector("pre");
    expect(pre?.textContent).toBe(JSON.stringify(simple, null, 2));
  });

  it("shows the draft 2020-12 identifier", () => {
    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    expect(document.querySelector("pre")?.textContent).toContain(
      "https://json-schema.org/draft/2020-12/schema"
    );
  });
});

describe("SchemaPreview — example tab", () => {
  beforeEach(() => {
    // Pin the optional-property gate in generateExample so the rendered
    // example is deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0.99);
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders a generated example that matches the schema shape", () => {
    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Example JSON" }));

    const pres = document.querySelectorAll("pre");
    const exampleText = pres[pres.length - 1]?.textContent ?? "";
    expect(JSON.parse(exampleText)).toEqual({ id: "string" });
  });

  it("generates examples for nested objects and arrays", () => {
    render(<SchemaPreview schema={nestedSchema()} open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Example JSON" }));

    const pres = document.querySelectorAll("pre");
    const parsed = JSON.parse(pres[pres.length - 1]?.textContent ?? "{}");
    expect(parsed.id).toBe("string");
    expect(Array.isArray(parsed.tags)).toBe(true);
    expect(parsed.info).toEqual({ active: true, count: 0 });
  });
});

describe("SchemaPreview — copy buttons", () => {
  it("copies the schema and flips the button label", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /copy schema/i }));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(simple, null, 2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument()
    );
  });

  it("copies the example from the example tab", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    render(<SchemaPreview schema={simple} open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Example JSON" }));
    fireEvent.click(screen.getByRole("button", { name: /copy example/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({ id: "string" });
    vi.restoreAllMocks();
  });
});

describe("preview from the editor", () => {
  it("opens the modal from the root Preview button", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    expect(screen.queryByText("Schema Preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /preview/i }));

    await waitFor(() =>
      expect(screen.getByText("Schema Preview")).toBeInTheDocument()
    );
  });

  it("previews the live schema, including an edit made first", async () => {
    render(<JsonSchemaEditor data={nestedSchema()} onSchemaChange={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Add Title"), {
      target: { value: "Edited" },
    });

    fireEvent.click(screen.getByRole("button", { name: /preview/i }));

    await waitFor(() =>
      expect(document.querySelector("pre")?.textContent).toContain('"title": "Edited"')
    );
  });
});
