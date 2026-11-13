import { test, expect } from "@playwright/test";
import { api, createDocument, sharedCollection, uniqueName } from "../support/api";

test.describe("History", () => {
  test("shows the current version of a document edited since its last revision", async ({ page, request }) => {
    const doc = await createDocument(request, {
      collectionId: sharedCollection().id,
      title: uniqueName("Release plan"),
      text: "Ship the beta in March.",
    });

    await page.goto(doc.url);
    await page.getByText("Ship the beta in March.").click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Invite the first customers in April.");
    await expect
      .poll(async () => (await api(request, "documents.info", { id: doc.id })).text)
      .toContain("Invite the first customers in April.");

    const revs = await api(request, "revisions.list", { documentId: doc.id });
    console.log("DIAG revisions", JSON.stringify(revs.map((r: any) => [r.id, r.createdAt, r.name])));
    console.log("DIAG doc", JSON.stringify((await api(request, "documents.info", { id: doc.id })).updatedAt));
    page.on("response", async (r) => {
      if (r.url().includes("revisions.")) console.log("DIAG", r.url(), r.request().postData(), (await r.text().catch(() => "")).slice(0, 300));
    });
    await page.goto(`${doc.url}/history`);
    const current = page.getByRole("complementary").getByText("Current version");
    await expect(current).toBeVisible();
    await current.click();

    const editor = page.locator(".ProseMirror").first();
    await expect(editor.getByText("Invite the first customers in April.")).toBeVisible();
  });
});
