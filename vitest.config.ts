import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
// The sibling packages carry a @ts-expect-error on this import; this repo's
// tsconfig sets allowJs, so TS resolves the .mjs helper and the directive would
// itself be an error (TS2578).
import { collectionFloor } from "./scripts/collection-floor.mjs";

// KAN-695: this package's harness was react-scripts 5 (CRA) + @testing-library/react 10.
// RTL 10's cleanup calls ReactDOM.unmountComponentAtNode, which React 19 removed, so the
// suite could not run on the React version the package already claims to support. The
// build is deliberately NOT part of this migration -- microbundle still emits
// dist/index.js + index.modern.js + index.esm.js + index.umd.js, because two consumers
// (egav-automation-frontend, egav-control-plane-frontend) resolve those exact paths.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // antd renders a Select per property row, and opening one dropdown in a tree
    // of ~7 Selects takes several seconds under jsdom (no layout engine, every
    // rc-trigger measurement recomputed). Vitest's 5s default fails those tests on
    // elapsed time alone -- measured: the same assertions pass at 40s and the DOM
    // is correct throughout. This raises the ceiling; it does not weaken any
    // assertion, and a genuinely wedged test still fails.
    testTimeout: 30000,
    hookTimeout: 30000,
    // Ported from egav-automation-widgets-ts / egav-data-exchange-widgets-ts
    // (KAN-436 / KAN-456). Vitest reports only the files it actually collected, so a
    // file dropped during collection still produces a green run. The floor compares
    // what was collected against what exists on disk and fails if anything is missing.
    // Registered here, not in an npm script, so `npx vitest run` is covered too.
    reporters: ["default", collectionFloor({ testDir: "." })],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // index.ts is a single re-export line; whoops.tsx is a 350KB inline SVG with no
      // logic; stories are a Storybook surface, not shipped code.
      exclude: [
        "src/index.ts",
        "src/**/*.d.ts",
        "src/stories/**",
        "src/JsonSchemaEditor/whoops.tsx",
        // Interfaces and type aliases only -- transpiles to an empty module, so
        // v8 reports 0/0 and renders it as 0%.
        "src/JsonSchemaEditor.types.ts",
      ],
      reporter: ["text", "lcov"],
      // Floors sit just under the measured figures (95.03 / 87.42 / 90.1 / 95.03
      // at 176 tests) so a real regression trips them rather than being absorbed.
      // Raise them when coverage rises; never lower one to make a run go green.
      thresholds: {
        lines: 93,
        functions: 88,
        branches: 85,
        statements: 93,
      },
    },
  },
});
