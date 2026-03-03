#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import { scanUrl } from "./scanner.js";
import { printTerminalReport } from "./terminal-reporter.js";

program
  .name("a11y-scan")
  .description(
    "Run accessibility scans on any URL using Playwright and axe-core",
  )
  .version("1.0.0")
  .argument("<url>", "URL to scan for accessibility issues")
  .action(async (url) => {
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const spinner = ora(
      `Scanning ${chalk.cyan(url)} for accessibility issues…`,
    ).start();

    try {
      const results = await scanUrl(url);
      spinner.succeed(`Scan complete for ${chalk.cyan(url)}`);
      printTerminalReport(results);
    } catch (error) {
      spinner.fail("Scan failed");
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
