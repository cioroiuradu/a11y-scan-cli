import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

export async function scanUrl(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });

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
