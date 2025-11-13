import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface SchemaRootProps {
    schema: JSONSchema7;
    onSchemaChange?: (results: string) => void;
    isReadOnly: boolean;
    updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
    onPreview?: () => void;
}
export declare const SchemaRoot: React.FunctionComponent<SchemaRootProps>;
