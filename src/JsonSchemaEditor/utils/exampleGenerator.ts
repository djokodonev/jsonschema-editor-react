import { JSONSchema7 } from "../../JsonSchemaEditor.types";

/**
 * Generates example JSON data from a JSON Schema
 */
export function generateExample(schema: JSONSchema7): any {
  if (!schema) {
    return null;
  }

  // Handle enum
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Handle const
  if (schema.const !== undefined) {
    return schema.const;
  }

  // Handle default value
  if (schema.default !== undefined) {
    return schema.default;
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case "string":
      if (schema.format === "date") {
        return "2024-01-01";
      }
      if (schema.format === "date-time") {
        return "2024-01-01T00:00:00Z";
      }
      if (schema.format === "email") {
        return "example@email.com";
      }
      if (schema.format === "uri") {
        return "https://example.com";
      }
      if (schema.minLength) {
        return "a".repeat(schema.minLength);
      }
      return "string";

    case "number":
      if (schema.minimum !== undefined) {
        return schema.minimum;
      }
      if (schema.maximum !== undefined) {
        return schema.maximum / 2;
      }
      return 0;

    case "integer":
      if (schema.minimum !== undefined) {
        return schema.minimum;
      }
      if (schema.maximum !== undefined) {
        return Math.floor(schema.maximum / 2);
      }
      return 0;

    case "boolean":
      return true;

    case "null":
      return null;

    case "array":
      if (schema.items) {
        const itemsSchema = Array.isArray(schema.items)
          ? schema.items[0]
          : schema.items;
        const itemExample = generateExample(itemsSchema as JSONSchema7);
        const minItems = schema.minItems || 1;
        return Array(minItems).fill(itemExample);
      }
      return [];

    case "object":
      const example: any = {};
      if (schema.properties) {
        const required = schema.required || [];
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const prop = propSchema as JSONSchema7;
          // Include required properties and some optional ones
          if (required.includes(key) || Math.random() > 0.3) {
            example[key] = generateExample(prop);
          }
        }
      }
      return example;

    default:
      return null;
  }
}
