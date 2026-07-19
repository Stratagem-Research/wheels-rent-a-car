import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import prettierConfig from "eslint-config-prettier";

/**
 * eslint-config-next already bundles jsx-a11y/recommended, so we don't import
 * jsx-a11y separately — adding it again triggers "Cannot redefine plugin".
 */
const config = [
  ...nextConfig,
  ...coreWebVitals,
  prettierConfig,
  {
    rules: {
      "jsx-a11y/anchor-is-valid": [
        "warn",
        {
          components: ["Link"],
          specialLink: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
