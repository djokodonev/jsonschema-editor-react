import { StoryObj, Meta } from "@storybook/react";
import { fn } from "@storybook/test";
import JsonSchemaEditor from "..";
import { readOnlyData, printIt } from "./helper";

export default {
  title: "Example/SchemaEditor",
  component: JsonSchemaEditor,
} as Meta;

type Story = StoryObj<typeof JsonSchemaEditor>;

export const NewJsonSchema: Story = {
  args: {
    onSchemaChange: fn(),
  },
};

export const WithData: Story = {
  args: {
    data: readOnlyData,
    onSchemaChange: fn((r) => {
      printIt(r);
    }),
  },
};
