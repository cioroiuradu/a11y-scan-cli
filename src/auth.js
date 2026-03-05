/**
 * Handles login detection, interactive browser authentication,
 * and session persistence via Playwright's storageState.
 * Sessions are stored per-domain in ~/.a11y-scan/
 */

import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const AUTH_DIR = join(homedir(), ".a11y-scan");

const LOGIN_PATTERNS = [
  "/login",
  "/signin",
  "/sign-in",
  "/sign_in",
  "/auth",
  "/sso",
  "/oauth",
  "/cas",
];

function getStoragePath(url) {
  const { hostname } = new URL(url);
  return join(AUTH_DIR, `${hostname}.json`);
}

/** Detect if the current page is a login/auth page via URL patterns or visible password fields. */
export async function isLoginPage(page) {
  const path = new URL(page.url()).pathname.toLowerCase();
  if (LOGIN_PATTERNS.some((p) => path.includes(p))) return true;

  const passwordFields = await page
    .locator('input[type="password"]:visible')
    .count();
  return passwordFields > 0;
}

/** Load a previously saved session for the given URL's domain. Returns null if none exists. */
export async function loadSession(url) {
  try {
    const data = await readFile(getStoragePath(url), "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Open a headed browser so the user can log in manually.
 * Waits up to 5 minutes for the browser to return to the original domain
 * on a non-login page (handles OAuth/SSO redirects to external providers).
 * Then saves the authenticated session for future scans.
 */
export async function interactiveLogin(url) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "load", timeout: 30_000 });

  const targetHost = new URL(url).hostname;
  const loginPageUrl = page.url();

  // Wait until: back on the original domain + not on a login path + URL changed from login page.
  // This prevents closing during OAuth redirects to Google, Microsoft, etc.
  await page.waitForURL(
    (u) => {
      if (u.hostname !== targetHost) return false;
      if (u.toString() === loginPageUrl) return false;
      const path = u.pathname.toLowerCase();
      return !LOGIN_PATTERNS.some((p) => path.includes(p));
    },
    { timeout: 300_000 },
  );

  // Let the page fully settle so all auth cookies/tokens are written
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");

  await mkdir(AUTH_DIR, { recursive: true });
  const state = await context.storageState();
  await writeFile(getStoragePath(url), JSON.stringify(state, null, 2), "utf-8");

  await browser.close();
  return state;
}
