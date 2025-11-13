import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface SchemaItemProps {
    item: JSONSchema7;
    name: string;
    parentSchema: JSONSchema7;
    required: string[];
    isReadOnly: boolean;
    onUpdate: (name: string, item: JSONSchema7) => void;
    onRename: (oldName: string, newName: string) => void;
    onDelete: (name: string) => void;
    onAddSibling: () => void;
    onAddChild?: (name: string) => void;
    onToggleRequired: (name: string, isRequired: boolean) => void;
    showAdvanced: (name: string) => void;
}
export declare const SchemaItem: React.FunctionComponent<SchemaItemProps>;
