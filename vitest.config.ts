import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "components/**/*.{test,spec}.{ts,tsx}",
      "lib/**/*.{test,spec}.{ts,tsx}",
      "app/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.ts",
    ],
    exclude: ["node_modules", ".next", "tests/e2e/**", "playwright-report/**"],
    css: false,
  },
});
