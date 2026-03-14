import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProgram } from "../cli.js";
import type { Command } from "commander";

describe("CLI", () => {
  let program: Command;

  beforeEach(() => {
    program = createProgram();
  });

  it("should create a program with correct name", () => {
    expect(program.name()).toBe("arbitrage-finder");
  });

  it("should have a scan command", () => {
    const scanCmd = program.commands.find((c) => c.name() === "scan");
    expect(scanCmd).toBeDefined();
  });

  it("should have a watch command", () => {
    const watchCmd = program.commands.find((c) => c.name() === "watch");
    expect(watchCmd).toBeDefined();
  });

  it("should have an analyze command", () => {
    const analyzeCmd = program.commands.find((c) => c.name() === "analyze");
    expect(analyzeCmd).toBeDefined();
  });

  describe("scan command", () => {
    it("should accept --category option", () => {
      const scanCmd = program.commands.find((c) => c.name() === "scan")!;
      const categoryOpt = scanCmd.options.find(
        (o) => o.long === "--category"
      );
      expect(categoryOpt).toBeDefined();
    });

    it("should accept --min-margin option", () => {
      const scanCmd = program.commands.find((c) => c.name() === "scan")!;
      const marginOpt = scanCmd.options.find(
        (o) => o.long === "--min-margin"
      );
      expect(marginOpt).toBeDefined();
    });

    it("should accept --json flag", () => {
      const scanCmd = program.commands.find((c) => c.name() === "scan")!;
      const jsonOpt = scanCmd.options.find((o) => o.long === "--json");
      expect(jsonOpt).toBeDefined();
    });
  });

  describe("watch command", () => {
    it("should accept --categories option", () => {
      const watchCmd = program.commands.find((c) => c.name() === "watch")!;
      const catOpt = watchCmd.options.find(
        (o) => o.long === "--categories"
      );
      expect(catOpt).toBeDefined();
    });

    it("should accept --interval option", () => {
      const watchCmd = program.commands.find((c) => c.name() === "watch")!;
      const intervalOpt = watchCmd.options.find(
        (o) => o.long === "--interval"
      );
      expect(intervalOpt).toBeDefined();
    });
  });

  describe("analyze command", () => {
    it("should accept a url argument", () => {
      const analyzeCmd = program.commands.find(
        (c) => c.name() === "analyze"
      )!;
      // Commander stores arguments in _args
      expect(analyzeCmd.registeredArguments.length).toBeGreaterThan(0);
    });
  });
});
