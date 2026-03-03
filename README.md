# a11y-scan-cli

Run accessibility (a11y) scans on any URL from the command line. Uses **Playwright** to load pages in a headless browser and **axe-core** to perform a full WCAG audit.

## Installation

```bash
npm install -g a11y-scan-cli
```

After installing, make sure Playwright browsers are available:

```bash
npx playwright install chromium
```

## Usage

```bash
# Scan a URL and print results in the terminal
a11y-scan https://example.com

# Scan and generate an HTML report
a11y-scan https://example.com --html

# Custom report filename
a11y-scan https://example.com --html my-report.html
```

## URL handling

If you omit the protocol, the CLI automatically prepends `https://`. Both `http://` and `https://` URLs are accepted as-is.

```bash
# These are equivalent
a11y-scan example.com
a11y-scan https://example.com
```

## Terminal output

When no `--html` flag is provided the tool prints three tables directly in the terminal:

### Summary

A high-level overview of the scan with the following counts:

| Status         | Description                                      |
| -------------- | ------------------------------------------------ |
| **Passed**     | Number of accessibility rules the page satisfies |
| **Violations** | Number of rules that failed                      |
| **Incomplete** | Rules that could not be automatically determined and need manual review |
| Inapplicable   | Rules that do not apply to the page              |

### Violations

Shown only when there are failures. Each row contains:

| Column          | Description                                           |
| --------------- | ----------------------------------------------------- |
| **#**           | Row number                                            |
| **Impact**      | Severity level — `critical`, `serious`, `moderate`, or `minor` |
| **Rule**        | The axe-core rule ID (e.g. `color-contrast`)          |
| **Description** | A short explanation of what the rule checks           |
| **Elements**    | Number of DOM elements affected                       |

### Incomplete

Shown only when some rules need manual review. Each row contains:

| Column          | Description                                           |
| --------------- | ----------------------------------------------------- |
| **#**           | Row number                                            |
| **Rule**        | The axe-core rule ID                                  |
| **Description** | A short explanation of what needs to be reviewed      |
| **Elements**    | Number of DOM elements that require manual checking   |

## Development

```bash
git clone https://github.com/youruser/a11y-scan-cli.git
cd a11y-scan-cli
npm install
npx playwright install chromium
node src/cli.js https://example.com
```

## License

MIT
