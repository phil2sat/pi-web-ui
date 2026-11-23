# Subagent Tool Policies

Subagent templates can define an explicit tool allowlist and contribute read-only capabilities to Plan Mode.

## Tool allowlists

The Subagent Template editor lists tools registered in the current session, including extension and plugin tools.

- An omitted `allowedTools` field preserves the legacy behavior and follows the session tool set.
- An explicit `allowedTools` array restricts the subagent to those tool names.
- An empty array denies every tool.
- The server applies the allowlist to tool visibility and checks it again at execution time.

The tool catalog is refreshed from the active session. A newly installed extension or plugin appears after its tools are registered and the catalog is pushed again.

## Read-only capability registry

Each template can contribute `readOnlyTools` entries. The server merges these entries with the built-in read-only registry to create the central Plan Mode policy.

A rule can allow every call to a tool:

```json
{ "name": "search_web" }
```

Action-based tools must declare the parameter and the exact allowed values:

```json
{
  "name": "browser_use",
  "parameter": "action",
  "values": ["search"]
}
```

Unknown tools and unregistered actions remain blocked in Plan Mode and in `readonly` / `verify` subagent modes. The editor displays the registered read-only status beside each tool. Only mark a tool or action read-only when its execution cannot mutate files, state, remote systems, or other sessions.

## Enforcement layers

- Plan Mode hides unregistered tools from the active tool set and checks every tool call against the central registry.
- Restricted subagents apply the same registry at execution time.
- A template allowlist is independent of the read-only registry: allowing a tool for a subagent does not make it read-only.
- `normal` subagents retain their normal execution permissions, but an explicit template allowlist still applies.
- Existing templates without `allowedTools` or `readOnlyTools` remain compatible. Built-in read-only capabilities are supplied by the default registry.
