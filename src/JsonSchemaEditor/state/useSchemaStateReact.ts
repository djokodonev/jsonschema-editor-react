import { useState, useEffect, useCallback } from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import Ajv from "ajv";

const ajv = new Ajv();

export const defaultSchema = (): JSONSchema7 => {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "title",
    description: "",
    properties: {},
    required: [],
  };
};

const isValidSchema = (schema: JSONSchema7): boolean => {
  const isValid = ajv.validateSchema(schema);
  return isValid;
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

