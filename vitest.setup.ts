process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL ??=
  "https://adoring-hugle.85-215-232-144.plesk.page/api/public";
process.env.WHEELS_INTERNAL_API_BASE_URL ??=
  "https://adoring-hugle.85-215-232-144.plesk.page/api/v1";

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
