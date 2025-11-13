import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { Form, InputNumber, Checkbox, Input, Row, Col } from "antd";

export interface AdvancedNumberProps {
  item: JSONSchema7;
  onUpdate: (updater: (item: JSONSchema7) => JSONSchema7) => void;
}

export const AdvancedNumber: React.FunctionComponent<AdvancedNumberProps> = (
  props: React.PropsWithChildren<AdvancedNumberProps>
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
  const enumData = item.enum ? (item.enum as number[]) : [];
  const enumValue = enumData?.map(String).join("\n") || "";

  return (
    <Form layout="vertical">
      <Form.Item label="Default">
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Default value"
          value={item.default as number | undefined}
          onChange={(val) => {
            onUpdate((prev) => ({
              ...prev,
              default: val ?? undefined,
            }));
          }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Min Value">
            <InputNumber
              style={{ width: "100%" }}
              value={item.minimum}
              onChange={(val) => {
                onUpdate((prev) => ({
                  ...prev,
                  minimum: val ?? undefined,
                }));
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Max Value">
            <InputNumber
              style={{ width: "100%" }}
              value={item.maximum}
              onChange={(val) => {
                onUpdate((prev) => ({
                  ...prev,
                  maximum: val ?? undefined,
                }));
              }}
            />
          </Form.Item>
        </Col>
      </Row>

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
              placeholder="ENUM Values - One Entry Per Line (numbers only)"
              rows={4}
              onChange={(e) => {
                const re = /^[0-9\n]+$/;
                if (e.target.value === "" || re.test(e.target.value)) {
                  const update = changeEnumOtherValue(e.target.value);
                  onUpdate((prev) => {
                    if (update && update.length > 0) {
                      return {
                        ...prev,
                        enum: update.map(Number),
                      };
                    } else {
                      // Remove enum if empty
                      const { enum: _, ...rest } = prev;
                      return rest;
                    }
                  });
                }
              }}
            />
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};
