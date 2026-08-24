import { describe, it } from "vitest";

/**
 * This integration journey requires an explicitly provisioned staging tenant,
 * authenticated session, and approved external-service configuration. Keep it
 * visible to the test runner without pretending that those prerequisites exist
 * in the repository-only CI environment.
 */
describe.skip("Live tenant workflow integration", () => {
  it("runs only with a provisioned staging tenant and approved credentials", () => {
    // The live journey is executed in the controlled browser/integration environment.
  });
});
