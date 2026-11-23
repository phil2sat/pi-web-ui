export interface ReadOnlyToolRule {
	name: string;
	parameter?: string;
	values?: string[];
	allowMissing?: boolean;
}

export const DEFAULT_READ_ONLY_TOOL_REGISTRY: ReadOnlyToolRule[] = [
	...["read", "grep", "find", "ls", "obs_recall", "present_files", "conversation_read", "terminal_read", "terminal_list", "terminal_wait", "load_tools", "tool_search", "compact_context", "ask_user_question", "search_web", "read_url"].map((name) => ({ name })),
	{ name: "terminal", parameter: "action", values: ["list", "read", "wait"] },
	{ name: "browser_use", parameter: "action", values: ["search"] },
	{ name: "skill", parameter: "action", values: ["read", "list", "report"], allowMissing: true },
	{ name: "scm", parameter: "action", values: ["status", "diff", "log", "history", "branches", "show"], allowMissing: true },
	{ name: "claim_files", parameter: "action", values: ["list"], allowMissing: true },
	{ name: "notes", parameter: "op", values: ["list"] },
	{ name: "remote_term", parameter: "action", values: ["list"] },
	{ name: "canvas", parameter: "action", values: ["list", "get", "get_log", "card_list"] },
	{ name: "worktree", parameter: "action", values: ["list"] },
	{ name: "lsp", parameter: "action", values: ["definition", "references", "hover", "diagnostics", "documentSymbol", "workspaceSymbol", "read_symbol", "cascade"] },
	{ name: "browser_page", parameter: "op", values: ["pages", "read", "shot"] },
	{ name: "browser_script", parameter: "action", values: ["list", "status"] },
];

export function normalizeReadOnlyToolRules(raw: unknown): ReadOnlyToolRule[] {
	if (!Array.isArray(raw)) return [];
	const byName = new Map<string, ReadOnlyToolRule>();
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const value = item as Record<string, unknown>;
		const name = typeof value.name === "string" ? value.name.trim() : "";
		if (!/^[A-Za-z0-9_.:-]{1,160}$/.test(name)) continue;
		const parameter = typeof value.parameter === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value.parameter) ? value.parameter : undefined;
		const values = Array.isArray(value.values) ? [...new Set(value.values.filter((entry): entry is string => typeof entry === "string" && entry.length > 0 && entry.length <= 128))].slice(0, 64) : undefined;
		byName.set(name, { name, ...(parameter ? { parameter } : {}), ...(values ? { values } : {}), ...(value.allowMissing === true ? { allowMissing: true } : {}) });
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 256);
}

export function mergeReadOnlyToolRules(...groups: readonly (readonly ReadOnlyToolRule[])[]): ReadOnlyToolRule[] {
	const merged = new Map<string, ReadOnlyToolRule>();
	for (const group of groups) for (const rule of normalizeReadOnlyToolRules(group)) {
		const previous = merged.get(rule.name);
		if (!previous) { merged.set(rule.name, rule); continue; }
		if (!previous.parameter && !rule.parameter) continue;
		if (previous.parameter !== rule.parameter) continue;
		merged.set(rule.name, { name: rule.name, parameter: rule.parameter, values: [...new Set([...(previous.values ?? []), ...(rule.values ?? [])])], ...(previous.allowMissing || rule.allowMissing ? { allowMissing: true } : {}) });
	}
	return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function isReadOnlyToolRegistered(rules: readonly ReadOnlyToolRule[], name: string): boolean {
	return rules.some((rule) => rule.name === name);
}

export function readOnlyRuleAllows(rules: readonly ReadOnlyToolRule[], name: string, params: unknown): boolean {
	const rule = rules.find((item) => item.name === name);
	if (!rule) return false;
	if (!rule.parameter) return true;
	if (!Array.isArray(rule.values) || rule.values.length === 0 || !params || typeof params !== "object") return false;
	const value = (params as Record<string, unknown>)[rule.parameter];
	return typeof value === "string" && rule.values.includes(value);
}
