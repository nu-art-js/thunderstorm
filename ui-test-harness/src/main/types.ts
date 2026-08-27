/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * The normalized view of a single committed component, produced by the fiber adapter.
 * Assertions receive props + state + dom together — the three truths collected before evaluation.
 */
export type ExtractedComponent = {
	/** `type.displayName ?? type.name`, or `undefined` when the fiber type carries no name. */
	name: string | undefined;
	/** All host roots owned by this component (document order); empty when it renders no host. */
	nodes: Element[];
	/** First owned host root — `nodes[0] ?? null`; convenience for single-host assertions. */
	node: Element | null;
	/** Resolved props: the class instance's `props`, or the function fiber's `memoizedProps`. */
	props: Record<string, unknown> | undefined;
	/** Class instance `state`, or named hook state when `hookKeys` were declared at registration. */
	state: Record<string, unknown> | undefined;
	/** Positional hook values when no `hookKeys` were declared; `undefined` for class components. */
	hooks: readonly unknown[] | undefined;
};

/** Why the engine halted: an assertion violation, hook-key drift, or a render/lifecycle exception. */
export type UI_AssertionFailureKind = 'assertion' | 'hook-drift' | 'exception';

/** The first failure that halted the run — reported via `getFirstFailure()`. */
export type UI_AssertionFailure = {
	/** Component fiber name, when known. */
	name: string | undefined;
	/** Component state at failure (class state or named hook state). */
	state: Record<string, unknown> | undefined;
	kind: UI_AssertionFailureKind;
	detail: string;
};

/**
 * A per-component assertion over the three truths. Returns a failure detail string when violated,
 * or `undefined` when the target satisfies it for its current state.
 */
export type UI_Assertion = (target: ExtractedComponent) => string | undefined;

/** Optional registration metadata for function-component named hook state. */
export type UI_AssertionOptions = {
	/** Declared hook variable names in `useState`/`useReducer` call order. */
	hookKeys?: readonly string[];
};

export type UI_AssertionRegistration = {
	assertion: UI_Assertion;
	hookKeys?: readonly string[];
};

/** Component-name → registered assertion. */
export type UI_AssertionMap = Record<string, UI_AssertionRegistration>;

/** Allowlisted render/lifecycle exception — negative tests register these so the engine does not halt. */
export type ExpectedException = {
	/** Fiber `displayName ?? name` of the throwing component. */
	component: string;
	/** Substring matched against the captured error message. */
	messageSubstring: string;
};

/** What happened during an assertion run — assertable independently of logger routing. */
export type UI_AssertionTraceAction = 'run-start' | 'assertion' | 'hook-drift' | 'exception' | 'run-complete';

/** Result of a trace step; `info` marks walk boundaries (not pass/fail checks). */
export type UI_AssertionTraceOutcome = 'pass' | 'fail' | 'info' | 'halt';

/** One observable step in a render-audit walk, accumulated until `drainTrace()`. */
export type UI_AssertionTrace = {
	name: string | undefined;
	action: UI_AssertionTraceAction;
	detail?: string;
	outcome: UI_AssertionTraceOutcome;
};
