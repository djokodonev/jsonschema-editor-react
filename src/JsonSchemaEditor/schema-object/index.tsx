import * as React from "react";
import { SchemaItem } from "../schema-item";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { AdvancedSettings } from "../schema-advanced";
import { Modal, Button, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getDefaultSchema, DataType, random } from "../utils";

export interface SchemaObjectProps {
  schema: JSONSchema7;
  isReadOnly: boolean;
  updateSchema: (updater: (schema: JSONSchema7) => JSONSchema7) => void;
}

export const SchemaObject: React.FunctionComponent<SchemaObjectProps> = (
  props: React.PropsWithChildren<SchemaObjectProps>
) => {
  const { schema, isReadOnly, updateSchema } = props;
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [advancedItem, setAdvancedItem] = React.useState<string>("");

  const properties = schema.properties || {};
  const propertyKeys = Object.keys(properties);

  const showAdvanced = (item: string) => {
    setAdvancedItem(item);
    setAdvancedOpen(true);
  };

  const onCloseAdvanced = () => {
    setAdvancedOpen(false);
    setAdvancedItem("");
  };

  const handleUpdateItem = (name: string, item: JSONSchema7) => {
    updateSchema((prev) => ({
      ...prev,
      properties: {
        ...(prev.properties || {}),
        [name]: item,
      },
    }));
  };

  const handleRenameItem = (oldName: string, newName: string) => {
    updateSchema((prev) => {
      const newProperties = { ...(prev.properties || {}) };
      if (newProperties[oldName]) {
        newProperties[newName] = newProperties[oldName];
        delete newProperties[oldName];
      }
      return {
        ...prev,
        properties: newProperties,
        required: (prev.required || []).map((r) =>
          r === oldName ? newName : r
        ),
      };
    });
  };

  const handleDeleteItem = (name: string) => {
    updateSchema((prev) => {
      const newProperties = { ...(prev.properties || {}) };
      delete newProperties[name];
      return {
        ...prev,
        properties: newProperties,
        required: (prev.required || []).filter((r) => r !== name),
      };
    });
  };

  const handleAddSibling = () => {
    const fieldName = `field_${random()}`;
    updateSchema((prev) => ({
      ...prev,
      properties: {
        ...(prev.properties || {}),
        [fieldName]: getDefaultSchema(DataType.string),
      },
    }));
  };

  const handleAddChild = (parentName: string) => {
    updateSchema((prev) => {
      const parentItem = prev.properties?.[parentName] as JSONSchema7;
      if (parentItem && parentItem.type === "object") {
        const fieldName = `field_${random()}`;
        return {
          ...prev,
          properties: {
            ...(prev.properties || {}),
            [parentName]: {
              ...parentItem,
              properties: {
                ...(parentItem.properties || {}),
                [fieldName]: getDefaultSchema(DataType.string),
              },
            },
          },
        };
      }
      return prev;
    });
  };

  const handleToggleRequired = (name: string, isRequired: boolean) => {
    updateSchema((prev) => {
      const required = prev.required || [];
      if (isRequired && !required.includes(name)) {
        return {
          ...prev,
          required: [...required, name],
        };
      } else if (!isRequired && required.includes(name)) {
        return {
          ...prev,
          required: required.filter((r) => r !== name),
        };
      }
      return prev;
    });
  };

  const currentItem =
    advancedItem && properties && properties[advancedItem]
      ? (properties[advancedItem] as JSONSchema7)
      : null;

  const hasProperties = properties && propertyKeys.length > 0;

  return (
    <div style={{ marginLeft: 24, marginTop: 8 }}>
      {hasProperties ? (
        propertyKeys.map((name) => {
          const item = properties[name] as JSONSchema7;
          return (
            <SchemaItem
              key={name}
              item={item}
              name={name}
              parentSchema={schema}
              required={schema.required || []}
              isReadOnly={isReadOnly}
              onUpdate={handleUpdateItem}
              onRename={handleRenameItem}
              onDelete={handleDeleteItem}
              onAddSibling={handleAddSibling}
              onAddChild={handleAddChild}
              onToggleRequired={handleToggleRequired}
              showAdvanced={showAdvanced}
            />
          );
        })
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px dashed #d9d9d9",
            borderRadius: "4px",
            padding: "16px",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          <Tooltip title="Add First Property">
            <Button
              disabled={isReadOnly}
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddSibling}
              size="small"
            >
              Add Property
            </Button>
          </Tooltip>
        </div>
      )}

      <Modal
        open={advancedOpen}
        onCancel={onCloseAdvanced}
        footer={null}
        title="Advanced Schema Settings"
      >
        {currentItem && (
          <AdvancedSettings
            item={currentItem}
            onUpdate={(updater) => {
              if (advancedItem) {
                handleUpdateItem(advancedItem, updater(currentItem));
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
};
