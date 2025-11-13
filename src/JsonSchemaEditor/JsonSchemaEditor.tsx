import * as React from "react";
import { ConfigProvider } from "antd";
import {
  useSchemaStateReact,
  defaultSchema,
} from "./state/useSchemaStateReact";
import { SchemaEditorProps } from "../JsonSchemaEditor.types";
import { SchemaRoot } from "./schema-root";
import { Whoops } from "./whoops";
import { SchemaObject } from "./schema-object";
import { SchemaArray } from "./schema-array";
import { SchemaPreview } from "./schema-preview";

export * from "../JsonSchemaEditor.types";

export const JsonSchemaEditor = (props: SchemaEditorProps) => {
  const { onSchemaChange, readOnly, data } = props;
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const schemaState = useSchemaStateReact(
    data ?? defaultSchema(),
    readOnly ?? false
  );

  // Notify parent of schema changes
  React.useEffect(() => {
    if (onSchemaChange) {
      onSchemaChange(JSON.stringify(schemaState.jsonSchema));
    }
  }, [onSchemaChange, schemaState.jsonSchema]);

  if (!schemaState.isValidSchema) {
    return <Whoops />;
  }

  return (
    <ConfigProvider>
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fafafa",
          minHeight: "100vh",
        }}
      >
        <SchemaRoot
          onSchemaChange={onSchemaChange}
          schema={schemaState.jsonSchema}
          isReadOnly={schemaState.isReadOnly}
          updateSchema={schemaState.updateSchema}
          onPreview={() => setPreviewOpen(true)}
        />

        {!Array.isArray(schemaState.jsonSchema.type) &&
          schemaState.jsonSchema.type === "object" && (
            <SchemaObject
              schema={schemaState.jsonSchema}
              isReadOnly={schemaState.isReadOnly}
              updateSchema={(updater) => {
                schemaState.updateSchema((prev) => {
                  const updated = updater(prev);
                  return updated;
                });
              }}
            />
          )}

        {!Array.isArray(schemaState.jsonSchema.type) &&
          schemaState.jsonSchema.type === "array" && (
            <SchemaArray
              schema={schemaState.jsonSchema}
              isReadOnly={schemaState.isReadOnly}
              updateSchema={(updater) => {
                schemaState.updateSchema((prev) => {
                  const updated = updater(prev);
                  return updated;
                });
              }}
            />
          )}

        <SchemaPreview
          schema={schemaState.jsonSchema}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    </ConfigProvider>
  );
};
