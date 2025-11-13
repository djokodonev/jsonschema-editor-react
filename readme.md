# JSON Schema Editor React

<p align="center">
  A React component for visually editing JSON Schema Draft 07
</p>

<p align="center">
  <a href="https://github.com/xojs/xo"><img src="https://img.shields.io/badge/code_style-XO-5ed9c7.svg"></a>➕
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>➕
  <a href="https://optum.github.io/jsonschema-editor-react/"><img src="https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg"></a>
</p>

## Recent Changes (2024)

### Major Refactoring

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
  - Updated `framer-motion` to v12 for React 18 support
  - Proper handling of React 18's rendering model

- **Bug Fixes**:
  - Fixed enum validation (empty enum arrays no longer cause schema validation errors)
  - Fixed adding/removing rows and properties
  - Fixed editing all field types (title, description, type)
  - Fixed child node addition for objects and arrays
  - Improved type safety with proper TypeScript types

## Description

> JSON Schema is hypermedia ready, and ideal for annotating your existing JSON-based HTTP API. JSON Schema documents are identified by URIs, which can be used in HTTP Link headers, and inside JSON Schema documents to allow recursive definitions. - [json-schema.org](https://json-schema.org/)

JsonSchemaEditor is a React component library that allows the easy generation of valid `Draft 07` JsonSchema from a UI, so that it can be easily persisted in a schema management system.

Benefits include:

- Describes your existing data format(s).
- Provides clear human- and machine- readable documentation.
- Validates data which is useful for:
  - Automated testing.
  - Ensuring quality of client submitted data.

## Installation

### Prerequisites

- Node.js >= 12.14.0
- React >= 18.2.0
- React DOM >= 18.2.0

### Install Package

```shell
npm install @scottwday/json-schema-editor
```

or

```shell
yarn add @scottwday/json-schema-editor
```

### Install Peer Dependencies

The component requires React 18 and Ant Design:

```shell
npm install react react-dom antd
```

or

```shell
yarn add react react-dom antd
```

**Note**: Ant Design v5 uses CSS-in-JS, so no manual CSS imports are required. The component automatically wraps itself with `ConfigProvider` to ensure styles are applied correctly.

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
import JsonSchemaEditor from "@scottwday/json-schema-editor";

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
import JsonSchemaEditor from "@scottwday/json-schema-editor";

const initialSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
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

## Features

- ✅ Visual JSON Schema editor for Draft 07
- ✅ Support for all JSON Schema types: string, number, integer, boolean, object, array
- ✅ Add/remove properties and nested objects
- ✅ Advanced settings for each type:
  - **String**: Default, Min/Max Length, Pattern, Enum, Format
  - **Number/Integer**: Default, Min/Max Value, Enum
  - **Boolean**: Default, Enum
- ✅ Required field management
- ✅ Real-time schema validation
- ✅ Type-safe with TypeScript
- ✅ Modern React 18 patterns
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

> Run tests

```shell
npm test
```

> Build for production

```shell
npm run build
```

## Dependencies

### Runtime Dependencies

- `antd`: ^5.28.1 - UI component library
- `ramda`: ^0.27.1 - Functional utilities
- `use-debounce`: ^6.0.1 - Debounce hook for input handling
- `ajv`: Used for schema validation (via dev dependencies)

### Peer Dependencies

- `react`: ^18.2.0
- `react-dom`: ^18.2.0

### Development Dependencies

- `typescript`: ^4.9.5
- `storybook`: ^8.4.7
- `react-scripts`: 5.0.1

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
