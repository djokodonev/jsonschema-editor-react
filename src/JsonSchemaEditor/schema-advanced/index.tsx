import * as React from "react";
import { AdvancedString } from "../advanced-string";
import { AdvancedNumber } from "../advanced-number";
import { AdvancedBoolean } from "../advanced-boolean";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";

export interface AdvancedSettingsProps {
  item: JSONSchema7;
  onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}

export const AdvancedSettings: React.FunctionComponent<
  AdvancedSettingsProps
> = (props: React.PropsWithChildren<AdvancedSettingsProps>) => {
  const { item, onUpdate } = props;

  const itemType = Array.isArray(item.type) ? item.type[0] : item.type;

  const getAdvancedView = (): JSX.Element | undefined => {
    switch (itemType) {
      case "string":
        return <AdvancedString item={item} onUpdate={onUpdate} />;
      case "number":
      case "integer":
        return <AdvancedNumber item={item} onUpdate={onUpdate} />;
      case "boolean":
        return <AdvancedBoolean item={item} onUpdate={onUpdate} />;
      default:
        return <div>No settings to show</div>;
    }
  };

  return <div>{getAdvancedView()}</div>;
};
