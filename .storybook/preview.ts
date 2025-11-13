import type { Preview } from "@storybook/react";
import { ConfigProvider } from "antd";
import React from "react";
import "@storybook/addon-console";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <ConfigProvider>
        <Story />
      </ConfigProvider>
    ),
  ],
  tags: ["autodocs", "autodocs"],
};

export default preview;

