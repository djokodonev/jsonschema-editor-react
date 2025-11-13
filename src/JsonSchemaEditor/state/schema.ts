import { hookstate, State } from "@hookstate/core";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
// @ts-ignore - Ajv2020 is a default export from the dist file
import Ajv2020 from "ajv/dist/2020";
import { Schema2 } from "../../JsonSchemaEditor.types";
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
  const isValid = ajv.validateSchema(schema);
  return isValid;
};

export const useSchemaState = (initialState: Schema2): State<Schema2> => {
  if (initialState.jsonSchema === undefined) {
    initialState.jsonSchema = defaultSchema();
  }

  initialState.isValidSchema = isValidSchema(initialState.jsonSchema);
  return hookstate<Schema2>(initialState);
};
