/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** A single Tier-1 invariant violation, as a human-readable detail string. */
export type Tier1Failure = string;

/**
 * Generic Tier-1 layout invariants for a target node — the checks that catch the structurally
 * broken UI agents tend to ship: collapsed regions and zero-box content.
 *
 * Direction-agnostic by construction: we inspect only visibility and box SIZE, never physical
 * left/right, so the result holds identically for LTR and RTL (computed `direction`). If a future
 * invariant needs position, it must use logical inline-start/end — never hardcoded left/right.
 */
export const runTier1 = (node: HTMLElement): Tier1Failure[] => {
	const failures: Tier1Failure[] = [];
	const style = getComputedStyle(node);

	if (style.display === 'none')
		failures.push('not-visible: display=none');

	if (style.visibility === 'hidden')
		failures.push('not-visible: visibility=hidden');

	const rect = node.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0)
		failures.push(`collapsed: zero-box width=${rect.width} height=${rect.height}`);

	return failures;
};
