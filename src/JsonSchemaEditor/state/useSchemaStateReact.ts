import { useState, useEffect, useCallback } from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
// @ts-ignore - Ajv2020 is a default export from the dist file
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv2020();

export const defaultSchema = (): JSONSchema7 => {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: "title",
    description: "",
    properties: {},
    required: [],
  };
};

const isValidSchema = (schema: JSONSchema7): boolean => {
  try {
    const isValid = ajv.validateSchema(schema);
    // validateSchema returns boolean synchronously for Ajv2020
    return typeof isValid === "boolean" ? isValid : false;
  } catch {
    return false;
  }
};

export interface UseSchemaStateReturn {
  jsonSchema: JSONSchema7;
  isValidSchema: boolean;
  isReadOnly: boolean;
  updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
  setSchema: (schema: JSONSchema7) => void;
}

export const useSchemaStateReact = (
  initialSchema?: JSONSchema7,
  isReadOnly: boolean = false
): UseSchemaStateReturn => {
  const [jsonSchema, setJsonSchema] = useState<JSONSchema7>(
    initialSchema ?? defaultSchema()
  );
  const [isValid, setIsValid] = useState(() => isValidSchema(jsonSchema));

  // Update validation when schema changes
  useEffect(() => {
    setIsValid(isValidSchema(jsonSchema));
  }, [jsonSchema]);

  const updateSchema = useCallback(
    (updater: (schema: JSONSchema7) => JSONSchema7) => {
      setJsonSchema((prev) => {
        const updated = updater(prev);
        return updated;
      });
    },
    []
  );

  const setSchema = useCallback((schema: JSONSchema7) => {
    setJsonSchema(schema);
  }, []);

  return {
    jsonSchema,
    isValidSchema: isValid,
    isReadOnly,
    updateSchema,
    setSchema,
  };
};

