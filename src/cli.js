#!/usr/bin/env node

/**
 * CLI entry point — parses arguments, runs the accessibility scan,
 * prints results to the terminal, and optionally generates an HTML report.
 */

import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exec } from "node:child_process";
import { scanUrl } from "./scanner.js";
import { printTerminalReport } from "./terminal-reporter.js";
import { generateHtmlReport } from "./html-reporter.js";
import { loadSession, interactiveLogin } from "./auth.js";

program
  .name("a11y-scan")
  .description(
    "Run accessibility scans on any URL using Playwright and axe-core",
  )
  .version("1.0.0")
  .argument("<url>", "URL to scan for accessibility issues")
  .option(
    "--html [filename]",
    "generate an HTML report (default: a11y-report.html)",
  )
  .action(async (url, options) => {
    // Default to https if no protocol is provided
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const spinner = ora(
      `Scanning ${chalk.cyan(url)} for accessibility issues…`,
    ).start();

    try {
      let session = await loadSession(url);
      let results = await scanUrl(url, { storageState: session });

      if (results.loginRequired) {
        spinner.info("Login required — opening browser for authentication…");
        console.log(
          chalk.dim(
            "  Complete the login in the browser window. It will close automatically.\n",
          ),
        );
        session = await interactiveLogin(url);
        spinner.start(`Scanning ${chalk.cyan(url)} for accessibility issues…`);
        results = await scanUrl(url, { storageState: session });

        if (results.loginRequired) {
          throw new Error(
            "Still redirected to login after authentication. Session may not have been saved correctly.",
          );
        }
      }

      spinner.succeed(`Scan complete for ${chalk.cyan(url)}`);

      // Generate HTML report if --html flag is present, then auto-open in browser
      if (options.html !== undefined) {
        const filename =
          typeof options.html === "string" ? options.html : "a11y-report.html";
        const outPath = resolve(filename);
        const html = generateHtmlReport(results);
        await writeFile(outPath, html, "utf-8");
        console.log(chalk.green(`\n📄 HTML report saved to ${outPath}\n`));

        const openCmd =
          process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
              ? "start"
              : "xdg-open";
        exec(`${openCmd} "${outPath}"`);
      }

      printTerminalReport(results);
    } catch (error) {
      spinner.fail("Scan failed");
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
