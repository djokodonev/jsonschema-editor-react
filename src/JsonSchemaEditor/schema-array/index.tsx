import * as React from "react";
import { JSONSchema7, JSONSchema7TypeName } from "../../JsonSchemaEditor.types";
import {
  SchemaTypes,
  getDefaultSchema,
  DataType,
  handleTypeChange as handleTypeChangeUtil,
} from "../utils";
import { SchemaObject } from "../schema-object";
import { AdvancedSettings } from "../schema-advanced";
import { Modal, Input, Select, Tooltip, Button } from "antd";
import { SettingOutlined, PlusOutlined } from "@ant-design/icons";

export interface SchemaArrayProps {
  schema: JSONSchema7;
  isReadOnly: boolean;
  updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
}

export const SchemaArray: React.FunctionComponent<SchemaArrayProps> = (
  props: React.PropsWithChildren<SchemaArrayProps>
) => {
  const { schema, isReadOnly, updateSchema } = props;
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const items = schema.items
    ? Array.isArray(schema.items)
      ? schema.items[0]
      : schema.items
    : null;

  const itemsSchema = items as JSONSchema7 | null;

  const handleTypeChange = (newType: JSONSchema7TypeName) => {
    const newSchema = handleTypeChangeUtil(newType, false);
    updateSchema((prev) => ({
      ...prev,
      items: newSchema as JSONSchema7,
    }));
  };

  const handleTitleChange = (value: string) => {
    if (itemsSchema) {
      updateSchema((prev) => ({
        ...prev,
        items: {
          ...itemsSchema,
          title: value,
        },
      }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (itemsSchema) {
      updateSchema((prev) => ({
        ...prev,
        items: {
          ...itemsSchema,
          description: value,
        },
      }));
    }
  };

  const handleAddProperty = () => {
    // Add a property to the object items schema
    if (
      itemsSchema &&
      !Array.isArray(itemsSchema.type) &&
      itemsSchema.type === "object"
    ) {
      const fieldName = `field_${Math.random().toString(36).substring(2, 6)}`;
      updateSchema((prev) => {
        const currentItems = prev.items as JSONSchema7;
        if (!currentItems) {
          return prev;
        }
        return {
          ...prev,
          items: {
            ...currentItems,
            type: "object",
            properties: {
              ...(currentItems.properties || {}),
              [fieldName]: getDefaultSchema(DataType.string),
            },
          },
        };
      });
    }
  };

  const showAdvanced = () => {
    setAdvancedOpen(true);
  };

  const onCloseAdvanced = () => {
    setAdvancedOpen(false);
  };

  if (!itemsSchema) {
    return null;
  }

  return (
    <div style={{ marginLeft: 24, marginTop: 8 }}>
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
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Input
            disabled
            value="Items"
            size="small"
            style={{ width: "120px", fontWeight: 600 }}
          />
          <Select
            disabled={isReadOnly}
            value={
              (Array.isArray(itemsSchema.type)
                ? itemsSchema.type[0]
                : itemsSchema.type) || undefined
            }
            size="small"
            onChange={handleTypeChange}
            style={{ width: "120px" }}
          >
            {SchemaTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type}
              </Select.Option>
            ))}
          </Select>
          <Input
            value={itemsSchema.title || ""}
            disabled={isReadOnly}
            placeholder="Title"
            size="small"
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            value={itemsSchema.description || ""}
            disabled={isReadOnly}
            placeholder="Description"
            size="small"
            onChange={(e) => handleDescriptionChange(e.target.value)}
            style={{ flex: 1 }}
          />
          {!Array.isArray(itemsSchema.type) &&
            itemsSchema.type !== "object" &&
            itemsSchema.type !== "array" && (
              <Tooltip title="Advanced Settings">
                <Button
                  disabled={isReadOnly}
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={showAdvanced}
                  size="small"
                />
              </Tooltip>
            )}
          {!Array.isArray(itemsSchema.type) &&
            itemsSchema.type === "object" && (
              <Tooltip title="Add Property">
                <Button
                  disabled={isReadOnly}
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddProperty}
                  size="small"
                />
              </Tooltip>
            )}
        </div>
      </div>

      {!Array.isArray(itemsSchema.type) && itemsSchema.type === "object" && (
        <SchemaObject
          schema={itemsSchema}
          isReadOnly={isReadOnly}
          updateSchema={(updater) => {
            const updated = updater(itemsSchema);
            updateSchema((prev) => ({
              ...prev,
              items: updated,
            }));
          }}
        />
      )}

      {!Array.isArray(itemsSchema.type) && itemsSchema.type === "array" && (
        <SchemaArray
          schema={itemsSchema}
          isReadOnly={isReadOnly}
          updateSchema={(updater) => {
            const updated = updater(itemsSchema);
            updateSchema((prev) => ({
              ...prev,
              items: updated,
            }));
          }}
        />
      )}

      <Modal
        open={advancedOpen}
        onCancel={onCloseAdvanced}
        footer={null}
        title="Advanced Array Schema Settings"
      >
        <AdvancedSettings
          item={itemsSchema}
          onUpdate={(updater) => {
            const updated = updater(itemsSchema);
            updateSchema((prev) => ({
              ...prev,
              items: updated,
            }));
          }}
        />
      </Modal>
    </div>
  );
};
