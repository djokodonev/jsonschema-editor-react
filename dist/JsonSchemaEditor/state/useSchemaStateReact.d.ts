import { JSONSchema7 } from "../../JsonSchemaEditor.types";
export declare const defaultSchema: () => JSONSchema7;
export interface UseSchemaStateReturn {
    jsonSchema: JSONSchema7;
    isValidSchema: boolean;
    isReadOnly: boolean;
    updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
    setSchema: (schema: JSONSchema7) => void;
}
export declare const useSchemaStateReact: (initialSchema?: JSONSchema7, isReadOnly?: boolean) => UseSchemaStateReturn;
