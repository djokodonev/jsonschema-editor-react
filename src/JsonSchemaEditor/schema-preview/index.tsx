import * as React from "react";
import { JSONSchema7 } from "../../JsonSchemaEditor.types";
import { Modal, Tabs, Button } from "antd";
import { EyeOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { generateExample } from "../utils/exampleGenerator";

export interface SchemaPreviewProps {
  schema: JSONSchema7;
  open: boolean;
  onClose: () => void;
}

export const SchemaPreview: React.FunctionComponent<SchemaPreviewProps> = (
  props: React.PropsWithChildren<SchemaPreviewProps>
) => {
  const { schema, open, onClose } = props;
  const [copied, setCopied] = React.useState<string | null>(null);

  const schemaString = React.useMemo(
    () => JSON.stringify(schema, null, 2),
    [schema]
  );

  const exampleJson = React.useMemo(() => {
    try {
      return generateExample(schema);
    } catch (error) {
      return { error: "Failed to generate example" };
    }
  }, [schema]);

  const exampleString = React.useMemo(
    () => JSON.stringify(exampleJson, null, 2),
    [exampleJson]
  );

  const handleCopy = (text: string, type: "schema" | "example") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const items = [
    {
      key: "schema",
      label: "JSON Schema",
      children: (
        <div>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              size="small"
              icon={copied === "schema" ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(schemaString, "schema")}
            >
              {copied === "schema" ? "Copied!" : "Copy Schema"}
            </Button>
          </div>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "500px",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            {schemaString}
          </pre>
        </div>
      ),
    },
    {
      key: "example",
      label: "Example JSON",
      children: (
        <div>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              size="small"
              icon={copied === "example" ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(exampleString, "example")}
            >
              {copied === "example" ? "Copied!" : "Copy Example"}
            </Button>
          </div>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "500px",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            {exampleString}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Schema Preview"
      width={800}
    >
      <Tabs items={items} />
    </Modal>
  );
};
