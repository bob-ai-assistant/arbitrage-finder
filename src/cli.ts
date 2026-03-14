import { Command } from "commander";
import chalk from "chalk";
import { createAllAdapters, createAdapter } from "./adapters/index.js";
import {
  computeMarketStats,
  findArbitrageOpportunities,
} from "./engine/analysis.js";
import { getAllCategories, getSearchTermsForCategory, getCategoryConfig } from "./categories/index.js";
import {
  filterOpportunities,
  formatAlertJson,
  createDefaultAlertConfig,
} from "./alerts/index.js";
import { config } from "./config.js";
import { saveListings, savePriceData, saveOpportunity, closeDb } from "./db/database.js";
import {
  printHeader,
  printOpportunity,
  printScanSummary,
} from "./utils/formatting.js";
import type { ProductCategory, Listing } from "./types.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("arbitrage-finder")
    .description(
      "Smart marketplace scanner for buy/sell arbitrage opportunities"
    )
    .version("1.0.0");

  program
    .command("scan")
    .description("Scan marketplaces for arbitrage opportunities")
    .option(
      "-c, --category <category>",
      "Product category (electronics, furniture, appliances, collectibles)"
    )
    .option(
      "-m, --min-margin <percent>",
      "Minimum margin percentage",
      String(config.minMarginPercent)
    )
    .option("-q, --query <query>", "Custom search query")
    .option("--json", "Output results as JSON")
    .option(
      "--marketplace <name>",
      "Only search a specific marketplace"
    )
    .action(async (opts) => {
      await runScan(opts);
    });

  program
    .command("watch")
    .description("Continuously watch for deals")
    .option(
      "--categories <categories>",
      "Comma-separated categories or 'all'",
      "all"
    )
    .option(
      "--interval <seconds>",
      "Scan interval in seconds",
      "300"
    )
    .option(
      "-m, --min-margin <percent>",
      "Minimum margin percentage",
      String(config.minMarginPercent)
    )
    .action(async (opts) => {
      await runWatch(opts);
    });

  program
    .command("analyze")
    .description("Analyze a specific listing URL")
    .argument("<url>", "URL of the listing to analyze")
    .action(async (url: string) => {
      await runAnalyze(url);
    });

  return program;
}

async function runScan(opts: {
  category?: string;
  minMargin: string;
  query?: string;
  json?: boolean;
  marketplace?: string;
}) {
  printHeader();
  const startTime = Date.now();

  const category = opts.category as ProductCategory | undefined;
  const minMargin = parseFloat(opts.minMargin);

  // Determine search terms
  let searchTerms: string[];
  if (opts.query) {
    searchTerms = [opts.query];
  } else if (category) {
    searchTerms = getSearchTermsForCategory(category).slice(0, 3);
    if (searchTerms.length === 0) {
      console.log(chalk.red(`Unknown category: ${category}`));
      return;
    }
  } else {
    // Default: take a few terms from each category
    searchTerms = getAllCategories().flatMap((c) =>
      c.searchTerms.slice(0, 2)
    );
  }

  console.log(
    chalk.dim(`  Scanning with ${searchTerms.length} search term(s)...`)
  );
  console.log(
    chalk.dim(`  Min margin: ${minMargin}% | Category: ${category ?? "all"}`)
  );
  console.log();

  // Set up adapters
  const adapters = opts.marketplace
    ? [createAdapter(opts.marketplace)].filter(Boolean)
    : createAllAdapters();

  if (adapters.length === 0) {
    console.log(chalk.red("  No valid adapters configured."));
    return;
  }

  // Gather listings from all adapters for all search terms
  const allListings: Map<string, Listing[]> = new Map();

  for (const term of searchTerms) {
    console.log(chalk.cyan(`  Searching: "${term}"`));

    for (const adapter of adapters) {
      try {
        const listings = await adapter!.search(term, {
          category,
          limit: 20,
        });
        console.log(
          chalk.dim(
            `    ${adapter!.name}: ${listings.length} results`
          )
        );

        const existing = allListings.get(adapter!.name) ?? [];
        allListings.set(adapter!.name, [...existing, ...listings]);

        // Save to DB
        if (listings.length > 0) {
          saveListings(listings);
        }
      } catch {
        console.log(chalk.dim(`    ${adapter!.name}: error`));
      }
    }
  }

  // Compute market stats per marketplace
  const marketPrices = new Map<
    string,
    { avgPrice: number; medianPrice: number }
  >();

  for (const [marketplace, listings] of allListings) {
    if (listings.length === 0) continue;
    const stats = computeMarketStats(
      listings,
      searchTerms.join(", "),
      marketplace
    );
    marketPrices.set(marketplace, {
      avgPrice: stats.avgPrice,
      medianPrice: stats.medianPrice,
    });
    savePriceData(stats);
  }

  // Find arbitrage opportunities from all buy listings
  const allBuyListings = Array.from(allListings.values()).flat();
  const opportunities = findArbitrageOpportunities(
    allBuyListings,
    marketPrices,
    config.fees
  );

  // Filter
  const alertConfig = {
    ...createDefaultAlertConfig(),
    minMarginPercent: minMargin,
    categories: category ? [category] : createDefaultAlertConfig().categories,
  };
  const filtered = filterOpportunities(opportunities, alertConfig);

  if (opts.json) {
    console.log(formatAlertJson(filtered));
  } else {
    if (filtered.length === 0) {
      console.log(
        chalk.yellow("\n  No opportunities found matching criteria.")
      );
    } else {
      filtered.forEach((opp, i) => {
        printOpportunity(opp, i);
        saveOpportunity(opp);
      });
    }
    printScanSummary(filtered, Date.now() - startTime);
  }

  closeDb();
}

async function runWatch(opts: {
  categories: string;
  interval: string;
  minMargin: string;
}) {
  const intervalSec = parseInt(opts.interval, 10);
  const categories =
    opts.categories === "all"
      ? undefined
      : opts.categories.split(",").map((c) => c.trim());

  console.log(
    chalk.cyan(
      `\n  Watching for deals every ${intervalSec}s (Ctrl+C to stop)\n`
    )
  );

  const scanOnce = async () => {
    const categoryOpt = categories?.[0] as ProductCategory | undefined;
    await runScan({
      category: categoryOpt,
      minMargin: opts.minMargin,
      json: false,
    });
  };

  await scanOnce();

  const timer = setInterval(scanOnce, intervalSec * 1000);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(timer);
    closeDb();
    console.log(chalk.dim("\n  Watch stopped."));
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

async function runAnalyze(url: string) {
  printHeader();
  console.log(chalk.cyan(`  Analyzing: ${url}\n`));

  // Determine which adapter to use based on URL
  let adapterName: string;
  if (url.includes("blocket.se")) {
    adapterName = "blocket";
  } else if (url.includes("tradera.com")) {
    adapterName = "tradera";
  } else if (url.includes("ebay.com")) {
    adapterName = "ebay";
  } else if (url.includes("facebook.com")) {
    adapterName = "facebook";
  } else {
    console.log(chalk.red("  Unsupported marketplace URL."));
    console.log(
      chalk.dim(
        "  Supported: blocket.se, tradera.com, ebay.com, facebook.com"
      )
    );
    return;
  }

  const adapter = createAdapter(adapterName);
  if (!adapter) return;

  try {
    // Extract ID from URL (simplified)
    const idMatch = url.match(/\/(\d+)/);
    const id = idMatch ? idMatch[1] : url;

    const detail = await adapter.getListingDetails(id);
    console.log(chalk.bold(`  ${detail.title}`));
    console.log(chalk.dim(`  Price: `) + chalk.bold(`${detail.price} ${detail.currency}`));
    console.log(chalk.dim(`  Marketplace: `) + detail.marketplace);
    if (detail.description) {
      console.log(chalk.dim(`  Description: `) + detail.description.slice(0, 200));
    }
    if (detail.seller) {
      console.log(chalk.dim(`  Seller: `) + detail.seller.name);
    }
    if (detail.condition) {
      console.log(chalk.dim(`  Condition: `) + detail.condition);
    }
    if (detail.images.length > 0) {
      console.log(chalk.dim(`  Images: `) + `${detail.images.length} photo(s)`);
    }

    // Compare with other marketplaces
    console.log(chalk.cyan("\n  Cross-marketplace comparison:"));
    const otherAdapters = createAllAdapters().filter(
      (a) => a.name !== adapterName
    );

    const searchQuery = detail.title.split(" ").slice(0, 3).join(" ");
    const marketPrices = new Map<
      string,
      { avgPrice: number; medianPrice: number }
    >();

    for (const other of otherAdapters) {
      try {
        const results = await other.search(searchQuery, { limit: 10 });
        if (results.length > 0) {
          const stats = computeMarketStats(results, searchQuery, other.name);
          console.log(
            chalk.dim(`    ${other.name}: `) +
              `avg ${Math.round(stats.avgPrice)} ${detail.currency} (${stats.sampleSize} listings)`
          );
          marketPrices.set(other.name, {
            avgPrice: stats.avgPrice,
            medianPrice: stats.medianPrice,
          });
        } else {
          console.log(chalk.dim(`    ${other.name}: no results`));
        }
      } catch {
        console.log(chalk.dim(`    ${other.name}: error`));
      }
    }

    // Show opportunities
    if (marketPrices.size > 0) {
      const opps = findArbitrageOpportunities(
        [detail],
        marketPrices,
        config.fees
      );
      if (opps.length > 0) {
        console.log(chalk.green("\n  Arbitrage opportunities:"));
        opps.forEach((opp, i) => printOpportunity(opp, i));
      } else {
        console.log(chalk.yellow("\n  No arbitrage opportunity detected."));
      }
    }
  } catch (err) {
    console.log(
      chalk.red(`  Failed to fetch listing: ${(err as Error).message}`)
    );
  }

  closeDb();
}
