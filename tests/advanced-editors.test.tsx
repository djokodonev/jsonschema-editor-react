import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdvancedSettings } from "../src/JsonSchemaEditor/schema-advanced";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";
import { selectOption, typeInto } from "./helpers";

/**
 * AdvancedSettings hands its parent an updater. Apply the most recent updater to
 * `base` and return the resulting schema.
 */
const applied = (
  onUpdate: ReturnType<typeof vi.fn>,
  base: JSONSchema7
): JSONSchema7 => {
  const updater = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0] as (
    s: JSONSchema7
  ) => JSONSchema7;
  return updater(base);
};

describe("AdvancedSettings — dispatch by type", () => {
  it("renders the string editor for a string", () => {
    render(<AdvancedSettings item={{ type: "string" }} onUpdate={vi.fn()} />);
    expect(screen.getByText("Min Length")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("renders the number editor for number and integer", () => {
    const { unmount } = render(
      <AdvancedSettings item={{ type: "number" }} onUpdate={vi.fn()} />
    );
    expect(screen.getByText("Min Value")).toBeInTheDocument();
    unmount();

    render(<AdvancedSettings item={{ type: "integer" }} onUpdate={vi.fn()} />);
    expect(screen.getByText("Min Value")).toBeInTheDocument();
  });

  it("renders the boolean editor for a boolean", () => {
    render(<AdvancedSettings item={{ type: "boolean" }} onUpdate={vi.fn()} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.queryByText("Min Length")).not.toBeInTheDocument();
  });

  it("falls back to a placeholder for object and array", () => {
    render(<AdvancedSettings item={{ type: "object" }} onUpdate={vi.fn()} />);
    expect(screen.getByText("No settings to show")).toBeInTheDocument();
  });

  it("uses the first entry of a union type", () => {
    render(<AdvancedSettings item={{ type: ["string", "null"] }} onUpdate={vi.fn()} />);
    expect(screen.getByText("Min Length")).toBeInTheDocument();
  });
});

describe("AdvancedString", () => {
  const base: JSONSchema7 = { type: "string" };

  it("writes a default value", async () => {
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    typeInto(screen.getByPlaceholderText("Default value"), "hello");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).default).toBe("hello");
  });

  it("writes a pattern", async () => {
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("Must be a valid regular expression."),
      "^a.*z$"
    );

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).pattern).toBe("^a.*z$");
  });

  it("writes minLength through the number input", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    const numbers = container.querySelectorAll(".ant-input-number-input");
    typeInto(numbers[0], "3");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).minLength).toBe(3);
  });

  it("picks a string format", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    selectOption(container.querySelector(".ant-select-selector") as Element, "email");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).format).toBe("email");
  });

  it("keeps the enum textarea disabled until the checkbox is ticked", () => {
    render(<AdvancedSettings item={base} onUpdate={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line")
    ).toBeDisabled();
  });

  it("enables the enum textarea when the schema already has an enum", () => {
    render(<AdvancedSettings item={{ type: "string", enum: ["a"] }} onUpdate={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line")
    ).toBeEnabled();
  });

  it("splits enum entries on newlines", async () => {
    const withEnum: JSONSchema7 = { type: "string", enum: ["a"] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line"),
      "red\ngreen\nblue"
    );

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum).enum).toEqual(["red", "green", "blue"]);
  });

  it("removes the enum key entirely when the textarea is cleared", async () => {
    const withEnum: JSONSchema7 = { type: "string", enum: ["a"] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(screen.getByPlaceholderText("ENUM Values - One Entry Per Line"), "");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum)).not.toHaveProperty("enum");
  });

  it("removes the enum key when the checkbox is unticked", async () => {
    const withEnum: JSONSchema7 = { type: "string", enum: ["a"] };
    const onUpdate = vi.fn();
    const { container } = render(
      <AdvancedSettings item={withEnum} onUpdate={onUpdate} />
    );

    fireEvent.click(container.querySelector('input[type="checkbox"]') as Element);

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum)).not.toHaveProperty("enum");
  });
});

describe("AdvancedNumber", () => {
  const base: JSONSchema7 = { type: "number" };

  it("writes minimum and maximum", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);
    const numbers = container.querySelectorAll(".ant-input-number-input");

    typeInto(numbers[1], "5");
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).minimum).toBe(5);

    typeInto(numbers[2], "50");
    await waitFor(() => expect(onUpdate.mock.calls.length).toBeGreaterThan(1));
    expect(applied(onUpdate, base).maximum).toBe(50);
  });

  it("writes a numeric default", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    typeInto(container.querySelectorAll(".ant-input-number-input")[0], "7");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).default).toBe(7);
  });

  it("coerces enum entries to numbers", async () => {
    const withEnum: JSONSchema7 = { type: "number", enum: [1] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line (numbers only)"),
      "1\n2\n3"
    );

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum).enum).toEqual([1, 2, 3]);
  });

  it("rejects non-numeric enum input outright", () => {
    const withEnum: JSONSchema7 = { type: "number", enum: [1] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line (numbers only)"),
      "abc"
    );

    // The regex guard means the handler never calls onUpdate at all.
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("AdvancedBoolean", () => {
  const base: JSONSchema7 = { type: "boolean" };

  it("sets the default to true", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    selectOption(container.querySelector(".ant-select-selector") as Element, "true");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).default).toBe(true);
  });

  it("sets the default to false", async () => {
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={base} onUpdate={onUpdate} />);

    selectOption(container.querySelector(".ant-select-selector") as Element, "false");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, base).default).toBe(false);
  });

  it("clears the default via None", async () => {
    const withDefault: JSONSchema7 = { type: "boolean", default: true };
    const onUpdate = vi.fn();
    const { container } = render(
      <AdvancedSettings item={withDefault} onUpdate={onUpdate} />
    );

    selectOption(container.querySelector(".ant-select-selector") as Element, "None");

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withDefault).default).toBeUndefined();
  });

  it("parses true/false enum lines case-insensitively", async () => {
    const withEnum: JSONSchema7 = { type: "boolean", enum: [true] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line (true/false)"),
      "TRUE\nfalse"
    );

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum).enum).toEqual([true, false]);
  });

  it("removes the enum key when the checkbox is unticked", async () => {
    const withEnum: JSONSchema7 = { type: "boolean", enum: [true] };
    const onUpdate = vi.fn();
    const { container } = render(
      <AdvancedSettings item={withEnum} onUpdate={onUpdate} />
    );

    fireEvent.click(container.querySelector('input[type="checkbox"]') as Element);

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum)).not.toHaveProperty("enum");
  });

  it("keeps the enum when the checkbox is ticked on", async () => {
    const noEnum: JSONSchema7 = { type: "boolean" };
    const onUpdate = vi.fn();
    const { container } = render(<AdvancedSettings item={noEnum} onUpdate={onUpdate} />);

    fireEvent.click(container.querySelector('input[type="checkbox"]') as Element);

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    // Ticking alone does not invent an empty enum array — values come from the
    // textarea, and an empty `enum: []` is not a valid schema.
    expect(applied(onUpdate, noEnum)).not.toHaveProperty("enum");
  });

  it("drops blank enum lines", async () => {
    const withEnum: JSONSchema7 = { type: "boolean", enum: [true] };
    const onUpdate = vi.fn();
    render(<AdvancedSettings item={withEnum} onUpdate={onUpdate} />);

    typeInto(
      screen.getByPlaceholderText("ENUM Values - One Entry Per Line (true/false)"),
      "true\n\n\nfalse"
    );

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(applied(onUpdate, withEnum).enum).toEqual([true, false]);
  });
});
