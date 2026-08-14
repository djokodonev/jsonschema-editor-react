# JSON Schema Editor React

<p align="center">
  A React component for visually editing JSON Schema Draft 2020-12 (OpenAPI 3.1/FastAPI compatible)
</p>

<p align="center">
  <a href="https://github.com/xojs/xo"><img src="https://img.shields.io/badge/code_style-XO-5ed9c7.svg"></a>➕
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>➕
  <a href="https://optum.github.io/jsonschema-editor-react/"><img src="https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg"></a>
</p>

## Recent Changes

### Unreleased — test harness migrated off CRA (KAN-695)

No runtime or API change; `dist` keeps the same entrypoints. Development only.

- **Tests now run on React 19.** The suite previously ran under `react-scripts`
  with `@testing-library/react` 10, whose cleanup calls
  `ReactDOM.unmountComponentAtNode` — removed in React 19. So the package
  claimed React 19 support (3.1.0/3.1.1) while its own tests could only ever
  execute against React 18. The harness is now vitest + jsdom +
  `@testing-library/react` 16 on `react@19.2.8`, matching the sibling packages.
- **The suite went from 1 test to 176.** The single pre-existing test rendered
  the component and asserted nothing. Coverage is now 95.0% of statements and
  90.1% of functions across the object/array/string/number/boolean editors, the
  preview modal, the example generator, ajv validation, and
  rename/add/delete/required toggling — with thresholds enforced in
  `vitest.config.ts`.
- **Storybook moved to the Vite builder.** `@storybook/preset-create-react-app`
  peers `react-scripts`, so it kept CRA in the tree; `@storybook/react-vite`
  replaces it and reuses the Vite that vitest already needs.
- **`scripts/test-guard-publish-registry.mjs` is now wired to `npm test`.** Its
  18 checks (KAN-473) existed but were run by no script and no workflow.
- `@types/jest@^25` and `@types/node@^12` removed/replaced; `rimraf` promoted to
  a direct devDependency (the storybook scripts use it, and it previously came
  in only transitively through `react-scripts`).

### 3.1.2 (2026) — runtime security fixes (KAN-692)

No API change. Clears every advisory that this package shipped into consumers'
`node_modules`. `npm audit --omit=dev` goes from 4 findings (1 high,
3 moderate) to **0**.

- `ajv` `^8.17.1` → `^8.20.0`. Fixes a ReDoS in ajv's `$data` option
  (GHSA-2g4f-4pwh-qvx6, patched in 8.18.0) and, transitively, drags `fast-uri`
  up with it.
- `fast-uri` 3.0.3 → 3.1.5 (transitive, via `ajv`). Five HIGH advisories:
  path traversal via percent-encoded dot segments (GHSA-q3j6-qgpj-74h6) and
  four host-confusion variants (GHSA-v39h-62p7-jpjc, GHSA-v2hh-gcrm-f6hx,
  GHSA-7p8r-x3mc-p8w7, GHSA-4c8g-83qw-93j6). Patched at 3.1.5.
- `@babel/runtime` 7.26.0 → 7.29.7 (transitive, via `@emotion/react`).
  Inefficient RegExp complexity in transpiled named capture groups
  (GHSA-968p-4wvh-cqc8).
- `yaml` 1.10.2 → 1.10.3 (transitive, via
  `@emotion/babel-plugin` → `babel-plugin-macros` → `cosmiconfig`). Stack
  overflow on deeply nested collections (GHSA-48c2-rrv3-qjmp).

Only `ajv` needed a manifest change; the other three moved within ranges their
parents already declared and were simply pinned back by the lockfile. No
`overrides` were added and no advisory was suppressed.

The remaining `npm audit` findings are all **dev-scope**, reached through
`react-scripts@5.0.1` / Storybook. They are not installed by consumers of this
package. **Largely resolved by KAN-695 below**, which removed `react-scripts`
entirely.

### 3.1.1 (2026) — React 18 install fix

3.1.0 declared `@ant-design/v5-patch-for-react-19` as an **optional** peer
dependency. GitHub Packages' packument drops `peerDependenciesMeta`, so the
`optional: true` marker never reached consumers and npm treated the patch as a
required peer. Because the patch itself peers `react >=19.0.0`, this broke
`npm install --strict-peer-deps` on React 18 hosts — the opposite of the
intent. 3.1.1 removes that peer entirely; React 19 hosts install the patch
themselves (see below). **Do not use 3.1.0 on React 18.**

### 3.1.0 (2026) — React 19 support

- Peer ranges widened to `react ^18.0.0 || ^19.0.0` and
  `react-dom ^18.0.0 || ^19.0.0`. React 18 is retained, so unmigrated consumers
  are unaffected. Before 3.1.0 the peers were React-18-only, which made
  `npm install` fail outright (`ERESOLVE`) for any React 19 host and forced an
  `overrides` workaround.
- Documented that React 19 hosts must install `@ant-design/v5-patch-for-react-19`
  themselves — see "React 19 hosts must apply the Ant Design patch" below. The
  package uses antd's static `message.error` API, which needs that patch on
  React 19. (3.1.0 declared it as an optional peer; see 3.1.1 above for why that
  had to be reverted.)
- Internal `JSX.Element` annotations changed to `React.JSX.Element`. React 19's
  `@types/react` removed the global `JSX` namespace.

### Major Refactoring (2024)

This project has been significantly refactored to use modern React patterns and Ant Design:

- **State Management**: Migrated from Hookstate to native React state management (`useState`, `useReducer`)
  - Removed dependency on `@hookstate/core` for state management
  - Uses React's built-in state hooks for better compatibility and predictability
  - Eliminated `HOOKSTATE-111` errors and reactivity issues

- **UI Framework**: Migrated from `react-bootstrap` to `antd` (Ant Design)
  - Modern, comprehensive component library
  - Better TypeScript support
  - Improved styling and UX
  - CSS-in-JS support (no manual CSS imports needed)

- **React 18 Compatibility**: Fully compatible with React 18
  - Proper handling of React 18's rendering model
  - (React 19 support arrived later — see 3.1.0/3.1.1 above. This package now
    peers `react ^18 || ^19`.)

- **Bug Fixes**:
  - Fixed enum validation (empty enum arrays no longer cause schema validation errors)
  - Fixed adding/removing rows and properties
  - Fixed editing all field types (title, description, type)
  - Fixed child node addition for objects and arrays
  - Improved type safety with proper TypeScript types

## Description

> JSON Schema is hypermedia ready, and ideal for annotating your existing JSON-based HTTP API. JSON Schema documents are identified by URIs, which can be used in HTTP Link headers, and inside JSON Schema documents to allow recursive definitions. - [json-schema.org](https://json-schema.org/)

JsonSchemaEditor is a React component library that allows the easy generation of valid **Draft 2020-12** JsonSchema from a UI, so that it can be easily persisted in a schema management system. This version is compatible with OpenAPI 3.1 and FastAPI.

Benefits include:

- Describes your existing data format(s).
- Provides clear human- and machine- readable documentation.
- Validates data which is useful for:
  - Automated testing.
  - Ensuring quality of client submitted data.

## Installation

### Prerequisites

- Node.js >= 12.14.0 to consume the package (see `engines`). Building or
  testing this repo needs Node >= 18 — vitest 3 and Storybook 8 require it.
- React 18 or React 19
- React DOM 18 or React DOM 19

### Install Package

```shell
npm install @djokodonev/jsonschema-editor-react
```

or

```shell
yarn add @djokodonev/jsonschema-editor-react
```

### Install Peer Dependencies

The component requires React and Ant Design v5:

```shell
npm install react react-dom antd
```

or

```shell
yarn add react react-dom antd
```

Peer ranges are `react ^18 || ^19`, `react-dom ^18 || ^19`, `antd ^5`. React 18
and React 19 hosts are both supported.

**Note**: Ant Design v5 uses CSS-in-JS, so no manual CSS imports are required. The component automatically wraps itself with `ConfigProvider` to ensure styles are applied correctly.

### React 19 hosts must apply the Ant Design patch

The editor reports a duplicate-property name through antd's static
`message.error` API, which internally relies on the legacy `ReactDOM.render`
that React 19 removed. On a React 19 host that error toast silently fails to
appear unless the host applies Ant Design's compatibility patch **once, at the
app entry point**:

```shell
npm install @ant-design/v5-patch-for-react-19
```

```tsx
// index.tsx / main.tsx — before rendering the app
import '@ant-design/v5-patch-for-react-19';
```

It is **not** declared as a peer dependency, deliberately. GitHub Packages'
packument drops `peerDependenciesMeta`, so an `optional: true` marker does not
survive publication and npm treats the peer as mandatory — and since the patch
itself peers `react >=19.0.0`, declaring it would break every React 18 consumer
under `--strict-peer-deps`. Install it yourself on React 19 hosts.

Nothing type-checks or fails at install time if you forget it — the symptom is a
missing toast at runtime.

## Props

| property       | type                               | description                                  | default               |
| -------------- | ---------------------------------- | -------------------------------------------- | --------------------- |
| data           | JSONSchema7 \| undefined           | the initial JSON Schema data for the editor  | undefined (creates default schema) |
| readOnly       | boolean \| undefined               | make editor read only                        | false                 |
| onSchemaChange | (results: string) => void \| undefined | callback method to capture changes to schema | undefined             |

## Usage

### Basic Example

```jsx
import React from "react";
import JsonSchemaEditor from "@djokodonev/json-schema-editor";

function App() {
  const handleSchemaChange = (schemaString) => {
    console.log("Schema changed:", schemaString);
    // Parse if needed
    const schema = JSON.parse(schemaString);
  };

  return (
    <div className="App">
      <JsonSchemaEditor
        onSchemaChange={handleSchemaChange}
      />
    </div>
  );
}

export default App;
```

### With Initial Data

```jsx
import React from "react";
import JsonSchemaEditor from "@djokodonev/json-schema-editor";

const initialSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  title: "My Schema",
  description: "A sample schema",
  properties: {
    name: {
      type: "string",
      title: "Name",
      description: "The name field"
    }
  }
};

function App() {
  return (
    <div className="App">
      <JsonSchemaEditor
        data={initialSchema}
        onSchemaChange={(schema) => console.log(schema)}
      />
    </div>
  );
}

export default App;
```

### Read-Only Mode

```jsx
<JsonSchemaEditor
  data={mySchema}
  readOnly={true}
  onSchemaChange={handleSchemaChange}
/>
```

### Schema Preview

The editor includes a built-in preview feature that shows both the generated JSON Schema and example JSON data:

- Click the **"Preview"** button in the root schema row
- View the JSON Schema in a formatted, copyable format
- View example JSON data that validates against your schema
- Copy either the schema or example JSON to your clipboard

The example JSON generator creates realistic examples based on:
- Enum values (uses first enum value if available)
- Default values
- Type-specific defaults (dates, emails, URIs, etc.)
- Required properties (always included)
- Optional properties (randomly included)

## Features

- ✅ Visual JSON Schema editor for Draft 2020-12 (compatible with OpenAPI 3.1/FastAPI)
- ✅ Support for all JSON Schema types: string, number, integer, boolean, object, array
- ✅ Add/remove properties and nested objects
- ✅ Advanced settings for each type:
  - **String**: Default, Min/Max Length, Pattern, Enum, Format
  - **Number/Integer**: Default, Min/Max Value, Enum
  - **Boolean**: Default, Enum
- ✅ Required field management
- ✅ Real-time schema validation
- ✅ **Schema Preview**: View generated JSON Schema and example JSON data
- ✅ **Example JSON Generator**: Automatically generates example JSON that validates against your schema
- ✅ Type-safe with TypeScript
- ✅ Modern React patterns — runs on React 18 and React 19
- ✅ Ant Design UI components

## Development

### Setup

```shell
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Commands

> Run Storybook (development server)

```shell
npm run storybook
```

Storybook will be available at `http://localhost:6006`

> Build Storybook documentation

```shell
npm run build-storybook
```

> Run tests (vitest + the publish-guard checks)

```shell
npm test              # vitest run, then scripts/test-guard-publish-registry.mjs
npm run test:watch    # vitest in watch mode
npm run test:coverage # with a v8 coverage report and thresholds
```

> Type-check both views (build input, and the whole tracked source tree)

```shell
npm run typecheck
```

> Build for production

```shell
npm run build
```

## Dependencies

### Runtime Dependencies

- `ajv`: ^8.20.0 - JSON Schema validator (Draft 2020-12)
- `ramda`: ^0.27.1 - Functional utilities
- `use-debounce`: ^6.0.1 - Debounce hook for input handling
- `@emotion/react`, `@emotion/styled`: ^11 - declared, but not imported by any
  module under `src/`. Tracked for removal; see KAN-695.

### Peer Dependencies

- `react`: ^18.0.0 || ^19.0.0
- `react-dom`: ^18.0.0 || ^19.0.0
- `antd`: ^5.0.0 (required, not optional — the UI is built from antd components)

### Development Dependencies

The dev harness is vitest + jsdom + Testing Library, matching the sibling
packages `egav-automation-widgets-ts` and `egav-data-exchange-widgets-ts`.

- `vitest`: 3.2.7 with `@vitest/coverage-v8` and `jsdom`
- `@testing-library/react`: 16.3.2 (+ `@testing-library/dom`, `jest-dom`, `user-event`)
- `react` / `react-dom`: 19.2.8 — the suite runs on React 19
- `typescript`: ^5
- `storybook`: 8.6.18 on the Vite builder (`@storybook/react-vite`)
- `microbundle`: ^0.13.1 — still the bundler; the published `dist` layout is
  unchanged because two apps import it

> **Removed in KAN-695:** `react-scripts` (CRA, unmaintained),
> `@storybook/preset-create-react-app`, `@storybook/react-webpack5`,
> `@types/jest`. Between them they accounted for the great majority of this
> repo's `npm audit` findings, including all three criticals. Full `npm audit`
> went from 63 findings (3 critical / 29 high) to 14 (0 critical / 10 high).
> `npm audit --omit=dev` was already 0 after 3.1.2 and stays 0.

## Migration from Previous Versions

If you're upgrading from a version that used Hookstate and react-bootstrap:

1. **Update imports**: No changes needed - the component API remains the same
2. **Install Ant Design**: Make sure `antd` is installed as a peer dependency
3. **Remove Hookstate**: The component no longer requires `@hookstate/core` for state management
4. **CSS**: No CSS imports needed - Ant Design v5 uses CSS-in-JS automatically

## License

json-schema-editor-react is Copyright © 2021-2025. It is free software and may be redistributed under the Apache 2.0 license.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Original work by Optum
- Forked and refactored to use modern React patterns and Ant Design
