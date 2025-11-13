import { JSONSchema7 } from "../JsonSchemaEditor/JsonSchemaEditor";

export const bad = {
  type: "notvalid",
  iwish: "doesnt matter",
};

export const readOnlyData: JSONSchema7 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/item",
  type: "object",
  title: "Item",
  description: "The schema for item info.",
  required: ["id", "name"],
  properties: {
    id: {
      type: "string",
      title: "string",
      description: "The unique identifier of the item.",
    },
    name: {
      type: "string",
      title: "string",
      description: "The display name of the item.",
    },
    info: {
      type: "object",
      title: "info",
      description: "The info for the item.",
      required: ["timestamp", "active"],
      properties: {
        timestamp: {
          type: "number",
          title: "long",
          description: "The info timestamp.",
        },
        active: {
          type: "boolean",
          title: "boolean",
          description: "The info active flag",
        },
        notes: {
          type: "string",
          title: "string",
          description: "The display name of the item.",
        },
      },
    },
    tags: {
      type: "array",
      title: "array",
      description: "Tags for grouping and filtering items.",
      items: {
        type: "string",
        title: "string",
        description: "",
      },
    },
    boxes: {
      type: "array",
      title: "array",
      description: "Boxes this item supports",
      items: {
        type: "object",
        title: "boxRecord",
        description: "",
        required: ["height", "width"],
        properties: {
          height: {
            type: "integer",
            title: "int",
            description: "The box height.",
          },
          width: {
            type: "integer",
            title: "int",
            description: "The box width.",
          },
          color: {
            type: "string",
            title: "string",
            description: "The box color.",
          },
        },
      },
    },
  },
};

export const printIt = (schema: string) => {
  console.log(schema);
};
