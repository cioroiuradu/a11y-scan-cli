/**
 * Prints axe-core scan results as formatted tables in the terminal:
 * a summary table, a violations table, and an incomplete (manual review) table.
 */

import chalk from "chalk";
import Table from "cli-table3";

/** Chalk formatters mapped to axe-core severity levels. */
const impactColor = {
  critical: chalk.bgRed.white.bold,
  serious: chalk.red.bold,
  moderate: chalk.yellow,
  minor: chalk.dim,
};

/** Print summary, violations, and incomplete tables to stdout. */
export function printTerminalReport(results) {
  const { violations, passes, incomplete, inapplicable } = results;

  console.log();

  const summaryTable = new Table({
    head: [chalk.bold("Status"), chalk.bold("Count")],
    colWidths: [25, 10],
    style: { head: [], border: [] },
  });

  summaryTable.push(
    [chalk.green("Passed"), chalk.green(passes)],
    [chalk.red("Violations"), chalk.red(violations.length)],
    [chalk.yellow("Incomplete"), chalk.yellow(incomplete.length)],
    ["Inapplicable", inapplicable],
  );

  console.log(chalk.bold.underline("Summary"));
  console.log(summaryTable.toString());

  if (violations.length === 0) {
    console.log(chalk.green.bold("\n✔ No accessibility violations found!"));
  } else {
    console.log();
    console.log(chalk.bold.underline(`Violations (${violations.length})`));
    console.log();

    const violationsTable = new Table({
      head: [
        chalk.bold("#"),
        chalk.bold("Impact"),
        chalk.bold("Rule"),
        chalk.bold("Description"),
        chalk.bold("Elements"),
      ],
      colWidths: [5, 12, 22, 44, 10],
      wordWrap: true,
      style: { head: [], border: [] },
    });

    violations.forEach((v, i) => {
      const colorize = impactColor[v.impact] ?? chalk.white;
      violationsTable.push([
        i + 1,
        colorize(v.impact),
        v.id,
        v.help,
        v.nodes.length,
      ]);
    });

    console.log(violationsTable.toString());
  }

  if (incomplete.length > 0) {
    console.log();
    console.log(
      chalk.bold.underline(
        `Incomplete — needs manual review (${incomplete.length})`,
      ),
    );
    console.log();

    const incompleteTable = new Table({
      head: [
        chalk.bold("#"),
        chalk.bold("Rule"),
        chalk.bold("Description"),
        chalk.bold("Elements"),
      ],
      colWidths: [5, 22, 54, 10],
      wordWrap: true,
      style: { head: [], border: [] },
    });

    incomplete.forEach((item, i) => {
      incompleteTable.push([i + 1, item.id, item.help, item.nodes.length]);
    });

    console.log(incompleteTable.toString());
  }

  console.log();
}
