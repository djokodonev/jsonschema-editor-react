# Adding Support for Later JSON Schema Specifications

## Current Status
- Currently supports: **Draft 07** only
- Schema version is hardcoded: `http://json-schema.org/draft-07/schema#`

## Target Versions
1. **Draft 2019-09** (Draft 8)
2. **Draft 2020-12** (Latest stable)

## Implementation Strategy

### 1. Make Schema Version Configurable

**Changes needed:**

#### A. Update Component Props
```typescript
export interface SchemaEditorProps {
  data?: JSONSchema7 | undefined;
  onSchemaChange?: (results: string) => void;
  readOnly?: boolean;
  schemaVersion?: "draft-07" | "draft/2019-09" | "draft/2020-12"; // New prop
}
```

#### B. Create Schema Version Utilities
Create `src/JsonSchemaEditor/utils/schemaVersions.ts`:
```typescript
export type SchemaVersion = "draft-07" | "draft/2019-09" | "draft/2020-12";

export const SCHEMA_VERSIONS: Record<SchemaVersion, string> = {
  "draft-07": "http://json-schema.org/draft-07/schema#",
  "draft/2019-09": "https://json-schema.org/draft/2019-09/schema",
  "draft/2020-12": "https://json-schema.org/draft/2020-12/schema",
};

export function getSchemaUri(version: SchemaVersion): string {
  return SCHEMA_VERSIONS[version];
}

export function detectSchemaVersion(schema: any): SchemaVersion {
  const $schema = schema?.$schema;
  if (!$schema) return "draft-07"; // Default
  
  if ($schema.includes("2020-12")) return "draft/2020-12";
  if ($schema.includes("2019-09")) return "draft/2019-09";
  return "draft-07";
}
```

### 2. Update Type Definitions

#### A. Create Version-Specific Types
Create `src/JsonSchemaEditor/types/` directory:
- `JSONSchema7.ts` - Current Draft 07 types
- `JSONSchema2019.ts` - Draft 2019-09 types
- `JSONSchema2020.ts` - Draft 2020-12 types

#### B. Create Union Type
```typescript
export type JSONSchema = JSONSchema7 | JSONSchema2019 | JSONSchema2020;
```

**Key differences in later drafts:**
- Draft 2019-09: `$recursiveRef` and `$recursiveAnchor` (deprecated in 2020-12)
- Draft 2020-12: 
  - `prefixItems` (replaces array form of `items`)
  - `$defs` (replaces `definitions`)
  - `$anchor` and `$dynamicAnchor` (replaces `$id` in some contexts)
  - `unevaluatedProperties` and `unevaluatedItems`
  - `dependentRequired` (replaces some `dependencies` uses)

### 3. Update Validation

#### A. Version-Aware Ajv Instances
Update `src/JsonSchemaEditor/state/useSchemaStateReact.ts`:

```typescript
import Ajv from "ajv";
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";

const validators: Record<SchemaVersion, Ajv> = {
  "draft-07": new Ajv(),
  "draft/2019-09": new Ajv2019(),
  "draft/2020-12": new Ajv2020(),
};

export const useSchemaStateReact = (
  initialSchema?: JSONSchema,
  isReadOnly: boolean = false,
  schemaVersion: SchemaVersion = "draft-07"
) => {
  const ajv = validators[schemaVersion];
  // ... rest of implementation
};
```

### 4. Update Default Schema Generator

Update `defaultSchema()` to accept version:
```typescript
export const defaultSchema = (version: SchemaVersion = "draft-07"): JSONSchema => {
  return {
    $schema: getSchemaUri(version),
    type: "object",
    title: "title",
    description: "",
    properties: {},
    required: [],
  };
};
```

### 5. Add UI for Version Selection

#### A. Add Version Selector to Root
In `src/JsonSchemaEditor/schema-root/index.tsx`:
```typescript
<Select
  value={schemaVersion}
  onChange={handleVersionChange}
  size="small"
  style={{ width: "150px" }}
>
  <Select.Option value="draft-07">Draft 07</Select.Option>
  <Select.Option value="draft/2019-09">Draft 2019-09</Select.Option>
  <Select.Option value="draft/2020-12">Draft 2020-12</Select.Option>
</Select>
```

### 6. Handle Version-Specific Features

#### A. Conditional Feature Rendering
Create feature flags based on version:
```typescript
const features = {
  prefixItems: schemaVersion === "draft/2020-12",
  $defs: schemaVersion === "draft/2020-12" || schemaVersion === "draft/2019-09",
  unevaluatedProperties: schemaVersion === "draft/2020-12",
  // ... etc
};
```

#### B. Update Advanced Settings
Add version-specific fields to advanced settings components:
- For Draft 2020-12: `prefixItems`, `unevaluatedProperties`, `unevaluatedItems`
- For Draft 2019-09: `$recursiveRef`, `$recursiveAnchor`

### 7. Migration/Conversion Utilities

Create utilities to convert between versions:
```typescript
export function convertToDraft2020(schema: JSONSchema7): JSONSchema2020 {
  // Convert items array to prefixItems
  // Convert definitions to $defs
  // Update $schema URI
  // ... etc
}
```

### 8. Update Example Generator

Update `generateExample()` to handle version-specific features:
- `prefixItems` instead of array `items`
- `$defs` instead of `definitions`

## Implementation Steps

1. **Phase 1: Make version configurable**
   - Add `schemaVersion` prop
   - Create version utilities
   - Update default schema generation

2. **Phase 2: Update validation**
   - Add version-aware Ajv instances
   - Update validation logic

3. **Phase 3: Add type definitions**
   - Create Draft 2019-09 types
   - Create Draft 2020-12 types
   - Create union type

4. **Phase 4: Add UI for version selection**
   - Add version selector to root
   - Show/hide features based on version

5. **Phase 5: Add new features**
   - Implement UI for `prefixItems`
   - Implement UI for `$defs`
   - Implement UI for `unevaluatedProperties`
   - Add migration utilities

6. **Phase 6: Testing**
   - Test backward compatibility
   - Test version conversion
   - Test validation for each version

## Backward Compatibility

- Default to Draft 07 if no version specified
- Auto-detect version from `$schema` field
- Warn users when converting between versions
- Preserve as much data as possible during conversion

## Dependencies

- Ajv already supports all three versions
- No new dependencies needed
- May need to update Ajv if using older version

## Files to Modify

1. `src/JsonSchemaEditor.types.ts` - Add new type definitions
2. `src/JsonSchemaEditor/JsonSchemaEditor.tsx` - Add version prop
3. `src/JsonSchemaEditor/state/useSchemaStateReact.ts` - Version-aware validation
4. `src/JsonSchemaEditor/utils.ts` - Update default schema
5. `src/JsonSchemaEditor/schema-root/index.tsx` - Add version selector
6. `src/JsonSchemaEditor/utils/exampleGenerator.ts` - Handle new features
7. `readme.md` - Document version support

## Example Usage

```jsx
<JsonSchemaEditor
  data={mySchema}
  schemaVersion="draft/2020-12"
  onSchemaChange={handleChange}
/>
```

