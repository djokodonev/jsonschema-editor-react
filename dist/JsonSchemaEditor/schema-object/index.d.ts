import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface SchemaObjectProps {
    schema: JSONSchema7;
    isReadOnly: boolean;
    updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
}
export declare const SchemaObject: React.FunctionComponent<SchemaObjectProps>;
