import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export interface SchemaPreviewProps {
    schema: JSONSchema7;
    open: boolean;
    onClose: () => void;
}
export declare const SchemaPreview: React.FunctionComponent<SchemaPreviewProps>;
