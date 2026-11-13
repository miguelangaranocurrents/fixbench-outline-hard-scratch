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
    await expect
      .poll(async () => (await api(request, "revisions.list", { documentId: doc.id })).length)
      .toBeGreaterThan(1);

    await page.goto(`${doc.url}/history`);
    await page.getByRole("complementary").getByRole("link", { name: /edited/ }).first().click();
    await expect(page.locator(".ProseMirror").first()).toContainText("Enterprise costs 99 dollars.");
    await page.waitForTimeout(3000);
    console.log("DIAG url", page.url());
    console.log("DIAG header", await page.locator("header").first().innerText());
    console.log("DIAG marks", await page.locator(".ProseMirror").first().innerHTML().then((h) => h.slice(0, 1500)));
    await expect(page.getByText(/^\d+ changes$/)).toBeVisible();

    await page.getByRole("button", { name: "Next change" }).click();
    await expect(page.getByText(/^1 of \d+ changes$/)).toBeVisible();
  });
});
