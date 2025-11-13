import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface AdvancedStringProps {
    item: JSONSchema7;
    onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}
export declare const AdvancedString: React.FunctionComponent<AdvancedStringProps>;
