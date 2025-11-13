import * as React from "react";
import { JSONSchema7, JSONSchema7TypeName } from "../../JsonSchemaEditor.types";
import {
  SchemaTypes,
  handleTypeChange as handleTypeChangeUtil,
} from "../utils";
import { useDebouncedCallback } from "use-debounce";
import { SchemaObject } from "../schema-object";
import { SchemaArray } from "../schema-array";
import { DropPlus } from "../drop-plus";
import { Input, Select, Tooltip, Button, Checkbox, message } from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export interface SchemaItemProps {
  item: JSONSchema7;
  name: string;
  parentSchema: JSONSchema7;
  required: string[];
  isReadOnly: boolean;
  onUpdate: (name: string, item: JSONSchema7) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onAddSibling: () => void;
  onAddChild?: (name: string) => void;
  onToggleRequired: (name: string, isRequired: boolean) => void;
  showAdvanced: (name: string) => void;
}

export const SchemaItem: React.FunctionComponent<SchemaItemProps> = (
  props: React.PropsWithChildren<SchemaItemProps>
) => {
  const {
    item,
    name,
    parentSchema,
    required,
    isReadOnly,
    onUpdate,
    onRename,
    onDelete,
    onAddSibling,
    onAddChild,
    onToggleRequired,
    showAdvanced,
  } = props;

  const [localName, setLocalName] = React.useState(name);
  const isRequired = required.includes(name);

  // Debounce callback for renaming
  const debouncedRename = useDebouncedCallback((newValue: string) => {
    if (newValue !== name) {
      if (parentSchema.properties?.[newValue]) {
        message.error(`Property '${newValue}' already exists!`);
      } else {
        onRename(name, newValue);
      }
    }
  }, 1000);

  const handleNameChange = (value: string) => {
    setLocalName(value);
    debouncedRename(value);
  };

  const handleTypeChange = (newType: JSONSchema7TypeName) => {
    const newSchema = handleTypeChangeUtil(newType, false);
    onUpdate(name, newSchema as JSONSchema7);
  };

  const handleTitleChange = (value: string) => {
    onUpdate(name, { ...item, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    onUpdate(name, { ...item, description: value });
  };

  const handleRequiredChange = (checked: boolean) => {
    onToggleRequired(name, checked);
  };

  const handleDelete = () => {
    onDelete(name);
  };

  const handleAddSibling = () => {
    onAddSibling();
  };

  const handleAddChild = () => {
    if (onAddChild) {
      onAddChild(name);
    }
  };

  if (!item) {
    return null;
  }

  return (
    <div style={{ marginLeft: 24, marginBottom: 8 }}>
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "4px",
          padding: "8px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#40a9ff";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(64,169,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e8e8e8";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Input
            type="text"
            disabled={isReadOnly}
            value={localName}
            placeholder="Property name"
            size="small"
            onChange={(e) => handleNameChange(e.target.value)}
            style={{ width: "150px", fontWeight: 500 }}
          />
          <Tooltip title="Required">
            <Checkbox
              disabled={isReadOnly}
              checked={isRequired}
              onChange={(e) => handleRequiredChange(e.target.checked)}
            />
          </Tooltip>
          <Select
            disabled={isReadOnly}
            value={
              (Array.isArray(item.type) ? item.type[0] : item.type) || undefined
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
            type="text"
            value={item.title || ""}
            disabled={isReadOnly}
            placeholder="Title"
            size="small"
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            type="text"
            value={item.description || ""}
            disabled={isReadOnly}
            placeholder="Description"
            size="small"
            onChange={(e) => handleDescriptionChange(e.target.value)}
            style={{ flex: 1 }}
          />
          {!Array.isArray(item.type) &&
            item.type !== "object" &&
            item.type !== "array" && (
              <Tooltip title="Advanced Settings">
                <Button
                  disabled={isReadOnly}
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => showAdvanced(name)}
                  size="small"
                />
              </Tooltip>
            )}
          <Tooltip title="Delete">
            <Button
              disabled={isReadOnly}
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              size="small"
            />
          </Tooltip>
          {!Array.isArray(item.type) && item.type === "object" ? (
            <DropPlus
              item={item}
              parentSchema={parentSchema}
              isDisabled={isReadOnly}
              onAddSibling={handleAddSibling}
              onAddChild={handleAddChild}
            />
          ) : (
            <Tooltip title="Add Sibling">
              <Button
                disabled={isReadOnly}
                type="text"
                icon={<PlusOutlined />}
                onClick={handleAddSibling}
                size="small"
              />
            </Tooltip>
          )}
        </div>
      </div>

      {!Array.isArray(item.type) && item.type === "object" && (
        <SchemaObject
          schema={item}
          isReadOnly={isReadOnly}
          updateSchema={(updater: (schema: JSONSchema7) => JSONSchema7) => {
            const updated = updater(item);
            onUpdate(name, updated);
          }}
        />
      )}

      {!Array.isArray(item.type) && item.type === "array" && (
        <SchemaArray
          schema={item}
          isReadOnly={isReadOnly}
          updateSchema={(updater: (schema: JSONSchema7) => JSONSchema7) => {
            const updated = updater(item);
            onUpdate(name, updated);
          }}
        />
      )}
    </div>
  );
};
