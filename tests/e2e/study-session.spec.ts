import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Open my journal" }).click();
}

test("signed-out visitors must sign in to view the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Entry" })).toHaveCount(0);
});

test("sign in, save a study session, and see persisted dashboard data", async ({ page, browser }) => {
  const email = `study-${randomUUID()}@example.test`;
  const password = "Study-e2e-only-password-42!";
  const subject = "E2E Calculus";
  const notes = "Practiced integration by parts and checked my answers.";
  const date = new Date().toISOString().slice(0, 10);

  // Create a fresh account through the real UI: no authentication mocks or
  // preloaded cookies, and no dependence on an existing user's study data.
  await page.goto("/register");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("checkbox", { name: "I have read and acknowledge the Privacy Policy." }).check();
  await page.getByRole("button", { name: "Create my journal" }).click();
  await expect(page).toHaveURL(/\/login\?success=account_created$/);

  await signIn(page, email, "Incorrect-password!");
  await expect(page.getByRole("alert").filter({
    hasText: "That email and password combination didn't match our records.",
  })).toBeVisible();
  await expect(page).toHaveURL(/\/login\?error=invalid_credentials$/);

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByLabel("0.0 total hours", { exact: true })).toBeVisible();

  // Scope labels to the manual entry form; the focus timer has its own fields.
  const entryForm = page.locator("form").filter({
    has: page.getByRole("button", { name: "Save Entry", exact: true }),
  });
  await entryForm.getByLabel("Subject", { exact: true }).fill(subject);
  await entryForm.getByLabel("Hours studied", { exact: true }).fill("1.5");
  await entryForm.getByLabel("Date", { exact: true }).fill(date);
  await entryForm.getByLabel("Notes", { exact: true }).fill(notes);
  await entryForm.getByRole("button", { name: "Save Entry", exact: true }).click();

  async function expectSavedEntry(currentPage: Page) {
    const previousEntry = currentPage.getByRole("region", { name: "Previous entry", exact: true });
    await expect(previousEntry).toContainText(subject);
    await expect(previousEntry).toContainText("1.5 hrs");
    await expect(previousEntry).toContainText(notes);
    await expect(currentPage.getByLabel("1.5 total hours", { exact: true })).toBeVisible();
  }

  await expectSavedEntry(page);
  await expect(entryForm.getByLabel("Subject", { exact: true })).toHaveValue("");

  // Confirm the actual database row, including owner, date and no duplicate save.
  const databaseUrl = new URL(process.env.E2E_DATABASE_URL!);
  if (databaseUrl.hostname !== "127.0.0.1" || databaseUrl.pathname !== "/study_e2e") {
    throw new Error("Database assertions require the disposable E2E database");
  }
  const pool = new Pool({ connectionString: databaseUrl.toString() });
  try {
    const { rows } = await pool.query(
      `SELECT s.subject, s.hours, s.date::text AS date, s.journal
       FROM "StudySession" s JOIN "User" u ON u.id = s."userId"
       WHERE u.email = $1`,
      [email],
    );
    expect(rows).toEqual([{ subject, hours: 1.5, date, journal: notes }]);
  } finally {
    await pool.end();
  }

  await page.reload();
  await expectSavedEntry(page);

  // A new browser context has no login cookies or client-side state.
  const freshContext = await browser.newContext({ baseURL: "http://127.0.0.1:3100", timezoneId: "UTC" });
  try {
    const freshPage = await freshContext.newPage();
    await signIn(freshPage, email, password);
    await expect(freshPage).toHaveURL(/\/dashboard$/);
    await expectSavedEntry(freshPage);
  } finally {
    await freshContext.close();
  }
});
