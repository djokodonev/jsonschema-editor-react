import * as React from "react";
	import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { Form, Select, Checkbox, Input, Row, Col } from "antd";

export interface AdvancedBooleanProps {
  item: JSONSchema7;
  onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}

export const AdvancedBoolean: React.FunctionComponent<AdvancedBooleanProps> = (
  props: React.PropsWithChildren<AdvancedBooleanProps>
) => {
  const { item, onUpdate } = props;

  const isEnumChecked = item.enum !== undefined;
  const enumData = item.enum ? (item.enum as boolean[]) : [];
  const enumValue = enumData.length > 0 ? enumData.map(String).join("\n") : "";

  const changeEnumValue = (value: string): boolean[] | null => {
    const lines = value.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      return null;
    }
    return lines.map((line) => line.trim().toLowerCase() === "true");
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Default">
        <Select
          value={
            item.default === true
              ? "true"
              : item.default === false
              ? "false"
              : ""
          }
          onChange={(val) => {
            onUpdate((prev) => ({
              ...prev,
              default:
                val === "true" ? true : val === "false" ? false : undefined,
            }));
          }}
        >
          <Select.Option value="">None</Select.Option>
          <Select.Option value="true">true</Select.Option>
          <Select.Option value="false">false</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="Enum">
        <Row gutter={8}>
          <Col span={2}>
            <Checkbox
              checked={isEnumChecked}
              onChange={(e) => {
                onUpdate((prev) => {
                  if (!e.target.checked) {
                    // Remove enum when unchecked
                    const { enum: _, ...rest } = prev;
                    return rest;
                  }
                  // When checked, keep existing enum or leave undefined
                  return prev;
                });
              }}
            />
          </Col>
          <Col span={22}>
            <Input.TextArea
              value={enumValue}
              disabled={!isEnumChecked}
              placeholder="ENUM Values - One Entry Per Line (true/false)"
              rows={4}
              onChange={(e) => {
                const update = changeEnumValue(e.target.value);
                onUpdate((prev) => {
                  if (update && update.length > 0) {
                    return {
                      ...prev,
                      enum: update,
                    };
                  } else {
                    // Remove enum if empty
                    const { enum: _, ...rest } = prev;
                    return rest;
                  }
                });
              }}
            />
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};
