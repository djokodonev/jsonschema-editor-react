import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { Button, Popover, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export interface DropPlusProps {
  item: JSONSchema7;
  parentSchema: JSONSchema7;
  isDisabled: boolean;
  onAddSibling: () => void;
  onAddChild: () => void;
}

export const DropPlus: React.FunctionComponent<DropPlusProps> = (
  props: React.PropsWithChildren<DropPlusProps>
) => {
  const { isDisabled, onAddSibling, onAddChild } = props;
  const [open, setOpen] = React.useState(false);

  if (isDisabled) {
    return null;
  }

  const handleAddSibling = () => {
    setOpen(false);
    onAddSibling();
  };

  const handleAddChild = () => {
    setOpen(false);
    onAddChild();
  };

  const content = (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button size="small" onClick={handleAddSibling} type="primary" block>
        Add Sibling
      </Button>
      <Button size="small" onClick={handleAddChild} danger block>
        Add Child
      </Button>
      <Button size="small" onClick={() => setOpen(false)} block>
        Cancel
      </Button>
    </Space>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="left"
    >
      <Button
        type="link"
        icon={<PlusOutlined />}
        size="small"
        onClick={() => setOpen(true)}
      />
    </Popover>
  );
};
