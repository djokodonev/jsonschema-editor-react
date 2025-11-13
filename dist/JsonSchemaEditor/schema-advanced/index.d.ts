import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface AdvancedSettingsProps {
    item: JSONSchema7;
    onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}
export declare const AdvancedSettings: React.FunctionComponent<AdvancedSettingsProps>;
