/**
 * Generates a self-contained HTML accessibility report from axe-core scan results.
 * All CSS and JS are inlined — no external dependencies needed to view the report.
 */

/** Sanitize dynamic strings to prevent XSS in generated HTML. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Return a colored badge `<span>` for the given axe-core severity level. */
function impactBadge(impact) {
  const colors = {
    critical: "#dc2626",
    serious: "#ea580c",
    moderate: "#ca8a04",
    minor: "#6b7280",
  };
  const bg = colors[impact] ?? "#6b7280";
  return `<span class="badge" style="--badge-color: ${bg}">${impact}</span>`;
}

/** Filter axe-core tags to WCAG/best-practice only and render as pill badges. */
function wcagTags(tags) {
  const wcag = tags.filter(
    (t) => t.startsWith("wcag") || t.startsWith("best-practice"),
  );
  if (wcag.length === 0) return "";
  return wcag.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ");
}

/** Render affected DOM elements with their HTML snippet, CSS selector, and a copy button. */
function renderNodes(nodes) {
  return nodes
    .map(
      (node) => `
        <div class="node">
          <div class="node-code-wrap">
            <code>${escapeHtml(node.html)}</code>
            <button class="copy-btn" onclick="copyToClipboard(this)" data-copy="${escapeHtml(node.html)}" title="Copy element">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <p class="node-target">${escapeHtml(node.target.join(", "))}</p>
          ${node.failureSummary ? `<p class="node-summary">${escapeHtml(node.failureSummary)}</p>` : ""}
        </div>`,
    )
    .join("");
}

/** Build a collapsible section (violations or incomplete) with one `<details>` card per rule. */
function renderSection(title, items, type) {
  if (items.length === 0) return "";

  const rows = items
    .map(
      (item, i) => `
      <details class="rule-card ${type}">
        <summary>
          <span class="rule-index">${i + 1}</span>
          ${type === "violation" ? impactBadge(item.impact) : ""}
          <span class="rule-id">${escapeHtml(item.id)}</span>
          <span class="rule-help">${escapeHtml(item.help)}</span>
          <span class="rule-count">${item.nodes.length} element${item.nodes.length !== 1 ? "s" : ""}</span>
        </summary>
        <div class="rule-details">
          <p class="rule-description">${escapeHtml(item.description)}</p>
          <div class="rule-tags">${wcagTags(item.tags)}</div>
          ${item.helpUrl ? `<a class="help-link" href="${escapeHtml(item.helpUrl)}" target="_blank" rel="noopener">Learn more ↗</a>` : ""}
          <div class="nodes-list">
            <h4>Affected elements</h4>
            ${renderNodes(item.nodes)}
          </div>
        </div>
      </details>`,
    )
    .join("");

  return `
      <section class="report-section">
        <h2 class="section-title ${type}">${title} <span class="section-count">${items.length}</span></h2>
        ${rows}
      </section>`;
}

/** Entry point — takes axe-core results and returns a complete, standalone HTML document string. */
export function generateHtmlReport(results) {
  const { url, timestamp, violations, passes, incomplete, inapplicable } =
    results;
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Report — ${escapeHtml(url)}</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
      :root {
        --bg: #f8f9fa;
        --surface: #ffffff;
        --border: #e2e5e9;
        --text: #1a1a1a;
        --text-secondary: #5f6672;
        --accent: #2563eb;
        --green: #16a34a;
        --red: #dc2626;
        --yellow: #ca8a04;
        --radius: 8px;
      }
  
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.5;
        min-height: 100vh;
      }
  
      .header {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 24px 0;
      }
  
      .container {
        max-width: 960px;
        margin: 0 auto;
        padding: 0 24px;
      }
  
      .header-top {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
  
      .header .logo {
        font-size: 20px;
        font-weight: 700;
        color: var(--accent);
      }
  
      .header .url {
        font-size: 14px;
        color: var(--text-secondary);
        word-break: break-all;
      }
  
      .header .url a {
        color: var(--accent);
        text-decoration: none;
      }
  
      .header .url a:hover { text-decoration: underline; }
  
      .header .timestamp {
        font-size: 13px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
  
      .summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin: 24px 0;
      }
  
      .stat-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
        text-align: center;
      }
  
      .stat-card .stat-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1.2;
      }
  
      .stat-card .stat-label {
        font-size: 13px;
        color: var(--text-secondary);
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
  
      .stat-card.passed .stat-value { color: var(--green); }
      .stat-card.violations .stat-value { color: var(--red); }
      .stat-card.incomplete .stat-value { color: var(--yellow); }
  
      .report-section {
        margin-bottom: 32px;
      }
  
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
  
      .section-title.violation { color: var(--red); }
      .section-title.incomplete { color: var(--yellow); }
  
      .section-count {
        background: var(--border);
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
      }
  
      .rule-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 8px;
        overflow: hidden;
      }
  
      .rule-card summary {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        cursor: pointer;
        font-size: 14px;
        list-style: none;
        user-select: none;
      }
  
      .rule-card summary::-webkit-details-marker { display: none; }
  
      .rule-card summary::before {
        content: "›";
        font-size: 18px;
        font-weight: 600;
        color: var(--text-secondary);
        transition: transform 0.15s;
        flex-shrink: 0;
        width: 12px;
      }
  
      .rule-card[open] summary::before { transform: rotate(90deg); }
  
      .rule-card summary:hover { background: var(--bg); }
  
      .rule-index {
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 600;
        min-width: 20px;
      }
  
      .badge {
        display: inline-block;
        color: #fff;
        background: var(--badge-color);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 2px 8px;
        border-radius: 4px;
        flex-shrink: 0;
      }
  
      .rule-id {
        font-family: "SF Mono", Monaco, Consolas, monospace;
        font-size: 13px;
        color: var(--accent);
        flex-shrink: 0;
      }
  
      .rule-help {
        flex: 1;
        min-width: 0;
      }
  
      .rule-count {
        font-size: 12px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }
  
      .rule-details {
        padding: 0 16px 16px 42px;
        font-size: 14px;
      }
  
      .rule-description {
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
  
      .rule-tags { margin-bottom: 8px; }
  
      .tag {
        display: inline-block;
        font-size: 11px;
        background: #eef2ff;
        color: #4338ca;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 4px;
      }
  
      .help-link {
        display: inline-block;
        font-size: 13px;
        color: var(--accent);
        text-decoration: none;
        margin-bottom: 12px;
      }
  
      .help-link:hover { text-decoration: underline; }
  
      .nodes-list h4 {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
      }
  
      .node {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
      }
  
      .node-code-wrap {
        position: relative;
      }
  
      .node code {
        display: block;
        font-size: 12px;
        font-family: "SF Mono", Monaco, Consolas, monospace;
        background: #1e1e2e;
        color: #cdd6f4;
        padding: 10px 40px 10px 12px;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
  
      .copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: transparent;
        border: 1px solid #45475a;
        border-radius: 4px;
        color: #9399b2;
        padding: 4px 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: all 0.15s;
      }
  
      .copy-btn:hover {
        background: #313244;
        color: #cdd6f4;
        border-color: #6c7086;
      }
  
      .copy-btn.copied {
        color: #a6e3a1;
        border-color: #a6e3a1;
      }
  
      .node-target {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 6px;
        font-family: "SF Mono", Monaco, Consolas, monospace;
      }
  
      .node-summary {
        font-size: 13px;
        color: var(--text-secondary);
        margin-top: 6px;
        white-space: pre-line;
      }
  
      .footer {
        text-align: center;
        padding: 24px;
        font-size: 13px;
        color: var(--text-secondary);
      }
  
      @media (max-width: 640px) {
        .summary { grid-template-columns: repeat(2, 1fr); }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="container">
        <div class="header-top">
          <span class="logo">a11y-scan</span>
        </div>
        <p class="url"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></p>
        <p class="timestamp">${escapeHtml(formattedDate)}</p>
      </div>
    </div>
  
    <div class="container">
      <div class="summary">
        <div class="stat-card passed">
          <div class="stat-value">${passes}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat-card violations">
          <div class="stat-value">${violations.length}</div>
          <div class="stat-label">Violations</div>
        </div>
        <div class="stat-card incomplete">
          <div class="stat-value">${incomplete.length}</div>
          <div class="stat-label">Incomplete</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${inapplicable}</div>
          <div class="stat-label">Inapplicable</div>
        </div>
      </div>
  
      ${renderSection("Violations", violations, "violation")}
      ${renderSection("Incomplete — Needs Manual Review", incomplete, "incomplete")}
    </div>
  
    <div class="footer">
      Generated by <strong>a11y-scan-cli</strong> using axe-core
    </div>
    <script>
      /** Copy element HTML to clipboard and briefly show a checkmark icon. */
      function copyToClipboard(btn) {
        const text = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add("copied");
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 1500);
        });
      }
    </script>
  </body>
  </html>`;
}
