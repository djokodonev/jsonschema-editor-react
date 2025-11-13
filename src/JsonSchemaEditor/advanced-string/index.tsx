import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { StringFormat } from "../utils";
import { Form, Input, InputNumber, Checkbox, Select, Row, Col } from "antd";

export interface AdvancedStringProps {
  item: JSONSchema7;
  onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}

export const AdvancedString: React.FunctionComponent<AdvancedStringProps> = (
  props: React.PropsWithChildren<AdvancedStringProps>
) => {
  const { item, onUpdate } = props;

  const changeEnumOtherValue = (value: string): string[] | null => {
    const array = value.split("\n");
    if (array.length === 0 || (array.length === 1 && !array[0])) {
      return null;
    }
    return array;
  };

  const isEnumChecked = item.enum !== undefined;
  const enumData = item.enum ? (item.enum as string[]) : [];
  const enumValue = enumData?.join("\n") || "";

  return (
    <Form layout="vertical">
      <Form.Item label="Default">
        <Input
          placeholder="Default value"
          value={(item.default as string) || ""}
          onChange={(e) => {
            onUpdate((prev) => ({
              ...prev,
              default: e.target.value,
            }));
          }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Min Length">
            <InputNumber
              style={{ width: "100%" }}
              value={item.minLength}
              onChange={(val) => {
                onUpdate((prev) => ({
                  ...prev,
                  minLength: val ?? undefined,
                }));
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Max Length">
            <InputNumber
              style={{ width: "100%" }}
              value={item.maxLength}
              onChange={(val) => {
                onUpdate((prev) => ({
                  ...prev,
                  maxLength: val ?? undefined,
                }));
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Pattern">
        <Input
          placeholder="Must be a valid regular expression."
          value={item.pattern || ""}
          onChange={(e) => {
            onUpdate((prev) => ({
              ...prev,
              pattern: e.target.value,
            }));
          }}
        />
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
                  // When checked, keep existing enum or leave undefined (don't set empty array)
                  // Enum will be set when user types values in textarea
                  return prev;
                });
              }}
            />
          </Col>
          <Col span={22}>
            <Input.TextArea
              value={enumValue}
              disabled={!isEnumChecked}
              placeholder="ENUM Values - One Entry Per Line"
              rows={4}
              onChange={(e) => {
                const update = changeEnumOtherValue(e.target.value);
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

      <Form.Item label="Format">
        <Select
          value={item.format || ""}
          onChange={(val) => {
            onUpdate((prev) => ({
              ...prev,
              format: val || undefined,
            }));
          }}
        >
          <Select.Option value="">None</Select.Option>
          {StringFormat.map((item) => (
            <Select.Option key={item.name} value={item.name}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
