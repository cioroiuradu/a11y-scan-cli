import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { isLoginPage } from "./auth.js";

/**
 * Launch a headless Chromium browser, navigate to the given URL,
 * run an axe-core accessibility audit, and return a normalized results object.
 * Accepts an optional storageState for authenticated sessions.
 * Returns { loginRequired: true } if a login page is detected.
 */
export async function scanUrl(url, { storageState } = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    storageState ? { storageState } : {},
  );
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });

    if (await isLoginPage(page)) {
      return { loginRequired: true };
    }

    const axeResults = await new AxeBuilder({ page }).analyze();

    return {
      url,
      timestamp: new Date().toISOString(),
      violations: axeResults.violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete,
      inapplicable: axeResults.inapplicable.length,
    };
  } finally {
    await browser.close();
  }
}
