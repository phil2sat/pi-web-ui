import { describe, expect, it } from "vitest";
import {
	DEFAULT_READ_ONLY_TOOL_REGISTRY,
	mergeReadOnlyToolRules,
	normalizeReadOnlyToolRules,
	readOnlyRuleAllows,
} from "../../server/read-only-tool-registry.js";
import { planModeDenial, readOnlyToolCallAllowed } from "../../server/plan-mode.js";

describe("read-only tool registry", () => {
	it("preserves built-in read-only capabilities and action boundaries", () => {
		expect(readOnlyToolCallAllowed("read_url", {})).toBe(true);
		expect(readOnlyToolCallAllowed("search_web", {})).toBe(true);
		expect(readOnlyToolCallAllowed("browser_use", { action: "search" })).toBe(true);
		expect(readOnlyToolCallAllowed("browser_use", { action: "click" })).toBe(false);
		expect(readOnlyToolCallAllowed("terminal", { action: "read" })).toBe(true);
		expect(readOnlyToolCallAllowed("terminal", { action: "input" })).toBe(false);
		expect(readOnlyToolCallAllowed("skill", {})).toBe(true);
		expect(readOnlyToolCallAllowed("unknown_extension_tool", {})).toBe(false);
	});

	it("supports explicitly registered extension tools without opening other actions", () => {
		const registry = mergeReadOnlyToolRules(DEFAULT_READ_ONLY_TOOL_REGISTRY, [
			{ name: "websearch_custom", parameter: "mode", values: ["query"] },
		]);
		expect(readOnlyToolCallAllowed("websearch_custom", { mode: "query" }, registry)).toBe(true);
		expect(readOnlyToolCallAllowed("websearch_custom", { mode: "delete" }, registry)).toBe(false);
		expect(readOnlyToolCallAllowed("unregistered_custom", {}, registry)).toBe(false);
		expect(planModeDenial("websearch_custom", { mode: "query" }, registry)).toBeUndefined();
		expect(planModeDenial("websearch_custom", { mode: "delete" }, registry)?.kind).toBe("write-tool");
	});

	it("normalizes untrusted registry data and merges compatible action rules", () => {
		const normalized = normalizeReadOnlyToolRules([
			{ name: "plugin_lookup" },
			{ name: "../unsafe" },
			{ name: "plugin_action", parameter: "action", values: ["read", 4, "write"] },
			null,
		]);
		expect(normalized).toEqual([
			{ name: "plugin_action", parameter: "action", values: ["read", "write"] },
			{ name: "plugin_lookup" },
		]);
		const merged = mergeReadOnlyToolRules(
			[{ name: "plugin_action", parameter: "action", values: ["read"], allowMissing: true }],
			[{ name: "plugin_action", parameter: "action", values: ["inspect"] }],
		);
		expect(readOnlyRuleAllows(merged, "plugin_action", { action: "inspect" })).toBe(true);
		expect(readOnlyRuleAllows(merged, "plugin_action", {})).toBe(true);
	});

	it("keeps the built-in registry available as the default policy", () => {
		expect(DEFAULT_READ_ONLY_TOOL_REGISTRY.some((rule) => rule.name === "read_url")).toBe(true);
	});
});
