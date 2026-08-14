import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// antd v5 calls the static `message.error(...)` from schema-item's rename handler.
// Under React 19 the static entrypoints go through ReactDOM.render, which React 19
// removed; this patch swaps them for createRoot. Without it, the duplicate-property
// path throws instead of showing the error. Importing it here (not in src) keeps it a
// dev/test concern -- 3.1.1 deliberately dropped it as a peer dependency because
// GitHub Packages strips peerDependenciesMeta and it broke React 18 installs.
import "@ant-design/v5-patch-for-react-19";

// antd reads matchMedia for responsive tokens; jsdom does not ship it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// The preview modal's copy buttons call navigator.clipboard.writeText, which jsdom
// does not implement. Tests that assert on copying replace this with a spy.
if (typeof navigator !== "undefined" && !navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    writable: true,
    configurable: true,
  });
}

if (typeof window !== "undefined" && !window.getComputedStyle) {
  throw new Error("jsdom did not provide getComputedStyle -- environment is wrong");
}

// antd renders Select dropdowns, Popovers and Tooltips into portal <div>s appended
// directly to document.body. RTL's cleanup only unmounts its own container, so those
// portal roots survive into the next test in the same file.
//
// This is not cosmetic. It made two tests fail in ways that pointed nowhere near the
// cause: a stale dropdown meant `selectOption` clicked an option belonging to an
// unmounted tree (the schema never changed, so the assertion timed out), and three
// leftover popovers meant `getByRole("button", { name: "Add Child" })` matched four
// elements and threw "found multiple" on every waitFor poll until the test timed out.
// Both read as "the interaction does not work" when the interaction was fine.
afterEach(() => {
  cleanup();
  for (const overlay of document.querySelectorAll(
    ".ant-select-dropdown, .ant-popover, .ant-tooltip"
  )) {
    // Remove the rc-portal wrapper, not just the overlay, so no empty portal
    // root is left behind for the next test's queries to walk into.
    const portalRoot = overlay.closest("body > div") ?? overlay;
    portalRoot.remove();
  }
});
