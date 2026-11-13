import { test, expect } from "@playwright/test";
import { api, createDocument, sharedCollection, uniqueName } from "../support/api";

test.describe("History", () => {
  test("steps through the highlighted changes of a revision", async ({ page, request }) => {
    const doc = await createDocument(request, {
      collectionId: sharedCollection().id,
      title: uniqueName("Pricing"),
      text: "Starter costs 10 dollars.\n\nTeam costs 20 dollars.\n\nEnterprise is on request.",
    });
    await api(request, "documents.update", {
      id: doc.id,
      text: "Starter costs 12 dollars.\n\nTeam costs 20 dollars.\n\nEnterprise costs 99 dollars.",
      done: true,
    });
    let revisions: { id: string }[] = [];
    await expect
      .poll(async () => (revisions = await api(request, "revisions.list", { documentId: doc.id })).length)
      .toBeGreaterThan(1);

    await page.goto(`${doc.url}/history/${revisions[0].id}?changes`);
    await expect(page.getByText(/^\d+ changes$/)).toBeVisible();

    await page.getByRole("button", { name: "Next change" }).click();
    await expect(page.getByText(/^1 of \d+ changes$/)).toBeVisible();
  });
});
