import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      reporter: ["text", "html", "clover"],
      include: [
        "src/app/core/api/**/*.ts",
        "src/app/core/health/**/*.ts",
        "src/app/features/**/api/**/*.ts",
        "src/app/features/**/facades/**/*.ts",
        "src/app/shared/hooks/**/*.ts",
        "src/tests/helpers/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.spec.ts",
        "src/tests/setup.ts",
        "src/app/core/api/api-types.ts",
        "src/app/features/**/models/**/*.ts",
      ],
    },
  },
})
