import { fireEvent, screen, within } from "@testing-library/react";
import { JSONSchema7 } from "../src/JsonSchemaEditor.types";

/**
 * A property row in the editor is a flex div whose first child is the
 * "Property name" input. antd's Input renders a bare <input>, so the row is
 * simply that input's parent element.
 */
export const rowFor = (name: string): HTMLElement => {
  const input = screen
    .getAllByPlaceholderText("Property name")
    .find((el) => (el as HTMLInputElement).value === name);
  if (!input) {
    const seen = screen
      .getAllByPlaceholderText("Property name")
      .map((el) => (el as HTMLInputElement).value);
    throw new Error(`no property row named "${name}" (found: ${seen.join(", ")})`);
  }
  return input.parentElement as HTMLElement;
};

/** Property names currently rendered, in DOM order. */
export const propertyNames = (): string[] =>
  screen
    .queryAllByPlaceholderText("Property name")
    .map((el) => (el as HTMLInputElement).value);

/**
 * antd Buttons are icon-only here, so they carry no accessible name. The icon
 * class is the stable handle: .anticon-delete / -setting / -plus.
 */
export const iconButton = (root: HTMLElement, icon: string): HTMLButtonElement => {
  const el = root.querySelector(`.anticon-${icon}`);
  const button = el?.closest("button");
  if (!button) throw new Error(`no button with icon "${icon}" in this row`);
  return button as HTMLButtonElement;
};

export const requiredCheckbox = (row: HTMLElement): HTMLInputElement => {
  const box = row.querySelector('input[type="checkbox"]');
  if (!box) throw new Error("no required checkbox in this row");
  return box as HTMLInputElement;
};

/** Type into an antd Input/TextArea and fire its change handler. */
export const typeInto = (input: Element, value: string): void => {
  fireEvent.change(input, { target: { value } });
};

/**
 * Drive an antd Select: open the dropdown, then click the option by text.
 * antd renders the dropdown into a portal on document.body.
 */
export const selectOption = (selector: Element, optionText: string): void => {
  fireEvent.mouseDown(selector);
  const dropdowns = document.querySelectorAll(".ant-select-dropdown");
  const last = dropdowns[dropdowns.length - 1] as HTMLElement;
  const option = within(last).getByTitle(optionText);
  fireEvent.click(option);
};

/** The `.ant-select-selector` inside a given row/container. */
export const selectorIn = (root: HTMLElement): Element => {
  const sel = root.querySelector(".ant-select-selector");
  if (!sel) throw new Error("no antd Select in this container");
  return sel;
};

/** Schema fixture: an object with a nested object and a nested array. */
export const nestedSchema = (): JSONSchema7 => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  title: "Item",
  description: "The schema for item info.",
  required: ["id"],
  properties: {
    id: { type: "string", title: "identifier", description: "unique id" },
    tags: { type: "array", items: { type: "string", title: "", description: "" } },
    info: {
      type: "object",
      title: "info",
      description: "nested",
      required: ["active"],
      properties: {
        active: { type: "boolean", title: "", description: "" },
        count: { type: "number", title: "", description: "" },
      },
    },
  },
});
