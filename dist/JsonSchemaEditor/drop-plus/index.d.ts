import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface DropPlusProps {
    item: JSONSchema7;
    parentSchema: JSONSchema7;
    isDisabled: boolean;
    onAddSibling: () => void;
    onAddChild: () => void;
}
export declare const DropPlus: React.FunctionComponent<DropPlusProps>;
