import { describe, expect, it } from "vitest";
import { subagentSecurityDenial } from "../../server/subagent-security-gate.js";

describe("configurable subagent read-only capabilities", () => {
	it("accepts a registered extension tool in readonly mode", () => {
		expect(subagentSecurityDenial("readonly", "plugin_lookup", {}, undefined, [{ name: "plugin_lookup" }])).toBeUndefined();
	});

	it("rejects unregistered tools and unregistered actions", () => {
		expect(subagentSecurityDenial("readonly", "plugin_write", {}, undefined, [])?.kind).toBe("not-allowed-tool");
		expect(
			subagentSecurityDenial("readonly", "plugin_action", { action: "delete" }, undefined, [
				{ name: "plugin_action", parameter: "action", values: ["read"] },
			])?.kind,
		).toBe("not-allowed-tool");
	});

	it("enforces an explicit empty template allowlist", () => {
		expect(
			subagentSecurityDenial("normal", "plugin_lookup", {}, new Set(), [{ name: "plugin_lookup" }])?.kind,
		).toBe("not-allowed-tool");
	});

	it("keeps template tool allowlists independent from read-only registration", () => {
		expect(
			subagentSecurityDenial("normal", "plugin_lookup", {}, new Set(["plugin_lookup"]), []) ,
		).toBeUndefined();
	});
});
