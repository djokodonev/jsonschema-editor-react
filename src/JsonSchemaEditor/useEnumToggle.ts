import * as React from "react";

/**
 * Whether the Enum editor is switched on (KAN-3564 / SGR-0020).
 *
 * The state used to be derived from `item.enum !== undefined`, but ticking the box
 * writes nothing until values are typed (an empty enum is not valid schema), so a
 * schema without an enum could never turn the editor on. The tick is kept locally and
 * a schema that already has an enum still reads as on.
 */
export function useEnumToggle(hasEnum: boolean): [boolean, (on: boolean) => void] {
  const [ticked, setTicked] = React.useState(false);
  return [ticked || hasEnum, setTicked];
}
