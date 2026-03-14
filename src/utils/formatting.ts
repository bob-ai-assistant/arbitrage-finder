import chalk from "chalk";
import type { ArbitrageOpportunity, Listing } from "../types.js";

export function formatCurrency(amount: number, currency: string = "SEK"): string {
  if (currency === "SEK") {
    return `${Math.round(amount).toLocaleString("sv-SE")} kr`;
  }
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  if (currency === "EUR") {
    return `€${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatMargin(marginPercent: number): string {
  if (marginPercent >= 40) return chalk.green.bold(`+${marginPercent.toFixed(1)}%`);
  if (marginPercent >= 20) return chalk.green(`+${marginPercent.toFixed(1)}%`);
  if (marginPercent >= 10) return chalk.yellow(`+${marginPercent.toFixed(1)}%`);
  return chalk.red(`+${marginPercent.toFixed(1)}%`);
}

export function formatConfidence(confidence: number): string {
  const pct = (confidence * 100).toFixed(0);
  if (confidence >= 0.8) return chalk.green(`${pct}%`);
  if (confidence >= 0.5) return chalk.yellow(`${pct}%`);
  return chalk.red(`${pct}%`);
}

export function formatScore(score: number): string {
  const stars = Math.min(5, Math.round(score / 20));
  const filled = "★".repeat(stars);
  const empty = "☆".repeat(5 - stars);
  if (score >= 70) return chalk.green(`${filled}${empty} ${score.toFixed(0)}`);
  if (score >= 40) return chalk.yellow(`${filled}${empty} ${score.toFixed(0)}`);
  return chalk.red(`${filled}${empty} ${score.toFixed(0)}`);
}

export function printListing(listing: Listing): void {
  console.log(
    chalk.dim("  ├─") +
      chalk.cyan(` [${listing.marketplace}]`) +
      ` ${listing.title}`
  );
  console.log(
    chalk.dim("  │  ") +
      chalk.bold(formatCurrency(listing.price, listing.currency)) +
      (listing.location ? chalk.dim(` · ${listing.location}`) : "") +
      (listing.condition ? chalk.dim(` · ${listing.condition}`) : "")
  );
  console.log(chalk.dim("  │  ") + chalk.underline(listing.url));
}

export function printOpportunity(opp: ArbitrageOpportunity, index: number): void {
  const header = chalk.bold.white(
    `\n  ${index + 1}. ${opp.buyListing.title}`
  );
  console.log(chalk.dim("─".repeat(70)));
  console.log(header);
  console.log();

  console.log(
    chalk.dim("  Buy:  ") +
      chalk.bold(formatCurrency(opp.buyPrice, opp.buyListing.currency)) +
      chalk.dim(` on ${opp.buyListing.marketplace}`)
  );
  console.log(
    chalk.dim("  Sell: ") +
      chalk.bold(formatCurrency(opp.estimatedSellPrice, opp.buyListing.currency)) +
      chalk.dim(` on ${opp.sellMarketplace}`)
  );
  console.log(
    chalk.dim("  Fees: ") +
      formatCurrency(opp.fees, opp.buyListing.currency)
  );
  console.log(
    chalk.dim("  Profit: ") +
      chalk.bold.green(formatCurrency(opp.estimatedProfit, opp.buyListing.currency)) +
      "  " +
      formatMargin(opp.marginPercent)
  );
  console.log();
  console.log(
    chalk.dim("  Confidence: ") +
      formatConfidence(opp.confidence) +
      chalk.dim("  Score: ") +
      formatScore(opp.score) +
      chalk.dim(`  Est. days to sell: ${opp.estimatedDaysToSell}`)
  );
  console.log(chalk.dim("  Reason: ") + chalk.italic(opp.reason));
  console.log(chalk.dim("  URL: ") + chalk.underline(opp.buyListing.url));
}

export function printHeader(): void {
  console.log();
  console.log(
    chalk.bold.cyan("  ╔═══════════════════════════════════════════╗")
  );
  console.log(
    chalk.bold.cyan("  ║") +
      chalk.bold.white("   Arbitrage Finder — Marketplace Scanner  ") +
      chalk.bold.cyan("║")
  );
  console.log(
    chalk.bold.cyan("  ╚═══════════════════════════════════════════╝")
  );
  console.log();
}

export function printScanSummary(
  opportunities: ArbitrageOpportunity[],
  durationMs: number
): void {
  console.log();
  console.log(chalk.dim("═".repeat(70)));
  console.log(
    chalk.bold(`  Scan complete in ${(durationMs / 1000).toFixed(1)}s`)
  );
  console.log(
    `  Found ${chalk.bold.green(String(opportunities.length))} opportunities`
  );

  if (opportunities.length > 0) {
    const totalProfit = opportunities.reduce(
      (sum, o) => sum + o.estimatedProfit,
      0
    );
    const avgMargin =
      opportunities.reduce((sum, o) => sum + o.marginPercent, 0) /
      opportunities.length;
    console.log(
      `  Total potential profit: ${chalk.bold.green(formatCurrency(totalProfit))}`
    );
    console.log(`  Average margin: ${formatMargin(avgMargin)}`);
  }
  console.log();
}
