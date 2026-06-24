/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * The normalized view of a single committed component, produced by the fiber adapter.
 * This is the universal oracle the audit reasons over — name + live DOM node + props/state —
 * with no knowledge of which framework or feature produced it.
 */
export type ExtractedComponent = {
	/** `type.displayName ?? type.name`, or `undefined` when the fiber type carries no name. */
	name: string | undefined;
	/** The component's first host DOM node (or its own, for host fibers); `null` when it renders nothing. */
	node: HTMLElement | null;
	/** Resolved props: the class instance's `props`, or the function fiber's `memoizedProps`. */
	props: Record<string, unknown> | undefined;
	/** Resolved state: the class instance's `state`; always `undefined` for function components. */
	state: Record<string, unknown> | undefined;
};

/** Why a target failed the audit: a generic layout invariant (`tier1`) or a named per-component `contract`. */
export type AuditFailureKind = 'tier1' | 'contract';

/** A single audit failure, accumulated per commit and returned by `RenderAudit.drain()`. */
export type AuditFailure = {
	name: string | undefined;
	kind: AuditFailureKind;
	detail: string;
};

/**
 * A per-component assertion. Returns a failure detail string when the contract is violated,
 * or `undefined` when the target satisfies it.
 */
export type Contract = (target: ExtractedComponent) => string | undefined;

/** Component-name → contract registry. */
export type ContractMap = Record<string, Contract>;
