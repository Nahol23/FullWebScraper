import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { ConfigRepository } from "../../../../infrastructure/repositories/ConfigRepository";
import { ApiConfig } from "../../../../config/ApiConfigLoader";
vi.mock("fs");

// Factory to ensure every config is valid
const makeConfig = (overrides: Partial<ApiConfig> = {}): ApiConfig => ({
  name: "default",
  baseUrl: "http://example.com",
  endpoint: "/test",
  method: "GET",
  ...overrides,
});

describe("ConfigRepository — full diagnostic suite", () => {
  const mockCwd = "/project";
  const configDir = path.join(mockCwd, "src", "config");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

    (fs.existsSync as any).mockReturnValue(true);
    (fs.readdirSync as any).mockReturnValue([]);
    (fs.readFileSync as any).mockReturnValue("");
    (fs.writeFileSync as any).mockReturnValue(undefined);
    (fs.mkdirSync as any).mockReturnValue(undefined);
    (fs.unlinkSync as any).mockReturnValue(undefined);
  });

  // ------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------
  describe("constructor", () => {
    it("creates the config directory when missing", () => {
      (fs.existsSync as any).mockReturnValueOnce(false);

      new ConfigRepository();

      expect(fs.mkdirSync).toHaveBeenCalledWith(configDir, { recursive: true });
    });

    it("does NOT recreate directory if it already exists", () => {
      (fs.existsSync as any).mockReturnValueOnce(true);

      new ConfigRepository();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------
  describe("findAll", () => {
    it("returns parsed configs — ensures JSON parsing works", async () => {
      (fs.readdirSync as any).mockReturnValue(["a.json"]);
      (fs.readFileSync as any).mockReturnValue(
        JSON.stringify(makeConfig({ name: "a" }))
      );

      const repo = new ConfigRepository();
      const result = await repo.findAll();

      expect(result).toEqual([makeConfig({ name: "a" })]);
    });

    it("ignores non-json files", async () => {
      (fs.readdirSync as any).mockReturnValue(["a.json", "ignore.txt"]);
      (fs.readFileSync as any).mockReturnValue(
        JSON.stringify(makeConfig({ name: "a" }))
      );

      const repo = new ConfigRepository();
      const result = await repo.findAll();

      expect(result).toEqual([makeConfig({ name: "a" })]);
    });

    it("throws when a JSON file is invalid — matches Swagger 500 scenario", async () => {
      (fs.readdirSync as any).mockReturnValue(["broken.json"]);
      (fs.readFileSync as any).mockReturnValue("INVALID_JSON");

      const repo = new ConfigRepository();

      await expect(repo.findAll()).rejects.toThrow();
    });

    it("throws when directory cannot be read", async () => {
      (fs.readdirSync as any).mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const repo = new ConfigRepository();

      await expect(repo.findAll()).rejects.toThrow("EACCES");
    });
    it("returns empty array when directory exists but has no JSON files", async () => {
      (fs.readdirSync as any).mockReturnValue([]);

      const repo = new ConfigRepository();
      const result = await repo.findAll();

      expect(result).toEqual([]);
    });
    it("simulates production 500: invalid JSON in config folder", async () => {
      (fs.readdirSync as any).mockReturnValue(["bad.json"]);
      (fs.readFileSync as any).mockReturnValue("INVALID_JSON");

      const repo = new ConfigRepository();

      await expect(repo.findAll()).rejects.toThrow();
    });
  });

  // ------------------------------------------------------------
  // findByName
  // ------------------------------------------------------------
  describe("findByName", () => {
    it("returns config when file exists", async () => {
      const filePath = path.join(configDir, "api.json");

      (fs.existsSync as any).mockImplementation((p: any) => p === filePath);
      (fs.readFileSync as any).mockReturnValue(
        JSON.stringify(makeConfig({ name: "api" }))
      );

      const repo = new ConfigRepository();
      const result = await repo.findByName("api");

      expect(result).toEqual(makeConfig({ name: "api" }));
    });

    it("returns null when file does NOT exist", async () => {
      (fs.existsSync as any).mockReturnValue(false);

      const repo = new ConfigRepository();
      const result = await repo.findByName("missing");

      expect(result).toBeNull();
    });

    it("throws on invalid JSON", async () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue("INVALID");

      const repo = new ConfigRepository();

      await expect(repo.findByName("bad")).rejects.toThrow();
    });

    it("throws when file cannot be read", async () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const repo = new ConfigRepository();

      await expect(repo.findByName("api")).rejects.toThrow("EACCES");
    });
  });

  // ------------------------------------------------------------
  // save
  // ------------------------------------------------------------
  describe("save", () => {
    it("writes the correct JSON", async () => {
      const repo = new ConfigRepository();
      const config = makeConfig({ name: "api" });

      await repo.save(config);

      const expectedPath = path.join(configDir, "api.json");

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
    });

    it("overwrites existing file", async () => {
      const repo = new ConfigRepository();

      await repo.save(makeConfig({ name: "api", endpoint: "/v1" }));
      await repo.save(makeConfig({ name: "api", endpoint: "/v2" }));

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it("throws when file cannot be written", async () => {
      (fs.writeFileSync as any).mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const repo = new ConfigRepository();

      await expect(repo.save(makeConfig({ name: "api" }))).rejects.toThrow(
        "EACCES"
      );
    });
  });

  // ------------------------------------------------------------
  // delete
  // ------------------------------------------------------------
  describe("delete", () => {
    it("deletes file when it exists", async () => {
      const filePath = path.join(configDir, "api.json");

      (fs.existsSync as any).mockImplementation((p: any) => p === filePath);

      const repo = new ConfigRepository();
      await repo.delete("api");

      expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
    });

    it("does nothing when file does NOT exist", async () => {
      (fs.existsSync as any).mockReturnValue(false);

      const repo = new ConfigRepository();
      await repo.delete("missing");

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it("throws when file cannot be deleted", async () => {
      const filePath = path.join(configDir, "api.json");

      (fs.existsSync as any).mockReturnValue(true);
      (fs.unlinkSync as any).mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const repo = new ConfigRepository();

      await expect(repo.delete("api")).rejects.toThrow("EACCES");
    });
  });

});
