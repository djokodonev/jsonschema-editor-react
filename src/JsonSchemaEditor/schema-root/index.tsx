import * as React from "react";
import { JSONSchema7, JSONSchema7TypeName } from "../../JsonSchemaEditor.types";
import { IoIosAddCircleOutline } from "react-icons/io";
import { getDefaultSchema, DataType, random } from "../utils";
import { Input, Select, Tooltip, Button, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export interface SchemaRootProps {
  schema: JSONSchema7;
  onSchemaChange?: (results: string) => void;
  isReadOnly: boolean;
  updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
}

export const SchemaRoot: React.FunctionComponent<SchemaRootProps> = (
  props: React.PropsWithChildren<SchemaRootProps>
) => {
  const { schema, isReadOnly, updateSchema } = props;

  const handleTitleChange = (value: string) => {
    updateSchema((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    updateSchema((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const handleAddChild = () => {
    const fieldName = `field_${random()}`;
    updateSchema((prev) => ({
      ...prev,
      properties: {
        ...(prev.properties || {}),
        [fieldName]: getDefaultSchema(DataType.string),
      },
    }));
  };

  return (
    <div data-testid="jsonschema-editor">
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Input
            disabled
            placeholder="root"
            style={{ width: "120px", fontWeight: 600 }}
            size="small"
          />
          <Tooltip title="All Required">
            <Checkbox disabled={isReadOnly} />
          </Tooltip>
          <Select
            disabled
            value={schema.type || "object"}
            style={{ width: "120px" }}
            size="small"
          >
            <Select.Option value="object">object</Select.Option>
          </Select>
          <Input
            type="text"
            value={schema.title || ""}
            disabled={isReadOnly}
            placeholder="Add Title"
            size="small"
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            type="text"
            value={schema.description || ""}
            disabled={isReadOnly}
            placeholder="Add Description"
            size="small"
            onChange={(e) => handleDescriptionChange(e.target.value)}
            style={{ flex: 1 }}
          />
          {schema.type === "object" && (
            <Tooltip title="Add Property">
              <Button
                disabled={isReadOnly}
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddChild}
                size="small"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
