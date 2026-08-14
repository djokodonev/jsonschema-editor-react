// KAN-695: was @storybook/react-webpack5 + @storybook/preset-create-react-app.
//
// That preset declares `react-scripts >=5.0.0` as a PEER dependency, and root
// devDependencies pinned react-scripts 5.0.1 to satisfy it. Between them they were
// the entire CRA/webpack/jest dependency chain -- the source of essentially every
// npm audit finding in this repo, including all three criticals (form-data,
// shell-quote, websocket-driver). None of it could be patched while CRA was the
// builder, because create-react-app is unmaintained.
//
// The Vite builder replaces it. Vite is already a dependency here for vitest, so
// this adds no new toolchain -- it removes one.
//
// The old webpackFinal aliased "@emotion/core" and "emotion-theming" onto
// @emotion/react. Both are pre-v11 emotion package names, and nothing under src/
// imports emotion at all, so the alias resolved names that were never requested.
// Dropped rather than translated to a Vite alias.

module.exports = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  docs: {},

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
