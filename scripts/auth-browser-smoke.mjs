import { chromium } from "playwright";
import assert from "node:assert/strict";

const baseUrl = process.env.TEST_BASE_URL;
if (!baseUrl) {
  console.error("Set TEST_BASE_URL to the preview origin before running this test.");
  process.exit(1);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Simulates a browser rejecting third-party Set-Cookie headers in an iframe.
  await context.route(/\/api\/auth\/(login|quick-login|register)$/, async (route) => {
    const response = await route.fetch();
    const responseHeaders = response.headers();
    delete responseHeaders["set-cookie"];
    await route.fulfill({ response, headers: responseHeaders });
  });

  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("Browser page error:", error.message));

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("button", { name: /Lecturer demo credentials/i }).click();
  await page.getByRole("button", { name: "Sign In as Student" }).click();
  await page.waitForURL(/\/student\/dashboard$/, { timeout: 30_000 });
  await page.getByRole("heading", { name: /Welcome, GAGIREDDY RAMREDDY/i }).waitFor();
  console.log("PASS: Student logged in with credentials");

  // Force a no-cookie environment even if the browser stored any cookie.
  await context.clearCookies();
  await page.getByRole("link", { name: "Available Exams", exact: true }).click();
  await page.getByRole("heading", { name: /Available Examinations \(2\)/ }).waitFor();
  await page.getByText("JAVA-15").first().waitFor();
  await page.getByText("DSA-15").first().waitFor();
  console.log("PASS: Java and DSA remain visible without cookies");

  await page.getByRole("link", { name: "Exam History" }).click();
  await page.getByRole("heading", { name: "Examination History" }).waitFor();
  console.log("PASS: History works without cookies");

  await page.getByRole("link", { name: "Results & Scorecard" }).click();
  await page.getByRole("heading", { name: "Examination Results & Scorecards" }).waitFor();
  console.log("PASS: Results work without cookies");

  await page.getByRole("link", { name: "My Profile" }).click();
  await page.getByRole("heading", { name: "My Student Profile" }).waitFor();
  console.log("PASS: Profile works without cookies");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "My Student Profile" }).waitFor();
  assert.equal(await page.getByText("Student Login Required").count(), 0);
  console.log("PASS: Refresh restores the browser session without cookies");

  await page.goto(`${baseUrl}/student/exams`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Available Examinations \(2\)/ }).waitFor();
  console.log("PASS: Direct URL navigation restores the session without cookies");

  const instructionsHref = await page.locator('a[href$="/instructions"]').first().getAttribute("href");
  assert.ok(instructionsHref, "At least one exam must be startable");
  await page.goto(`${baseUrl}${instructionsHref}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Examination/ }).first().waitFor();
  console.log("PASS: Exam instructions load without cookies");

  await page.getByRole("link", { name: "My Dashboard" }).click();
  await page.getByRole("button", { name: "Logout", exact: true }).first().click();
  await page.waitForURL(/\/login$/, { timeout: 15_000 });
  await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Student Login Required" }).waitFor();
  console.log("PASS: Logout clears browser auth and protected pages are gated");

  await page.getByRole("button", { name: /One-Click Demo Student Login/ }).click();
  await page.getByRole("heading", { name: /Welcome, GAGIREDDY RAMREDDY/i }).waitFor();
  console.log("PASS: One-click login recovers from the login-required screen");

  await context.close();

  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await adminContext.route(/\/api\/auth\/login$/, async (route) => {
    const response = await route.fetch();
    const responseHeaders = response.headers();
    delete responseHeaders["set-cookie"];
    await route.fulfill({ response, headers: responseHeaders });
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await adminPage.getByRole("button", { name: "Administrator" }).click();
  await adminPage.getByPlaceholder("admin@exam.edu").fill("admin@exam.edu");
  await adminPage.locator('input[type="password"]').fill("admin123");
  await adminPage.getByRole("button", { name: "Sign In as Admin" }).click();
  await adminPage.waitForURL(/\/admin\/dashboard$/, { timeout: 30_000 });
  await adminPage.getByRole("heading", { name: "Administrative Dashboard" }).waitFor();
  await adminContext.clearCookies();
  await adminPage.getByRole("link", { name: "Examinations", exact: true }).click();
  await adminPage.getByRole("heading", { name: "Examination Management" }).waitFor();
  await adminPage.getByRole("link", { name: "Question Banks" }).click();
  await adminPage.getByRole("heading", { name: "Question Banks" }).waitFor();
  console.log("PASS: Admin dashboard and management navigation work without cookies");
  await adminContext.close();
} finally {
  await browser.close();
}
