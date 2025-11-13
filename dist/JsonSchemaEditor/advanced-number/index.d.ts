import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface AdvancedNumberProps {
    item: JSONSchema7;
    onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}
export declare const AdvancedNumber: React.FunctionComponent<AdvancedNumberProps>;
