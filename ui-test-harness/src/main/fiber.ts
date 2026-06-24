/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ExtractedComponent} from './types.js';

/**
 * THE ONLY file that touches React fiber internals — a single, swappable adapter.
 * If React changes its internal shapes, this is the one place to fix.
 *
 * We never import `react`/`react-dom`; the fiber tree is reached purely via the DevTools
 * global hook (see `install.ts`). Accordingly, the fiber shape below is *our* intermediate
 * type for what we actually observe at runtime — not a trusted SDK declaration.
 */
export type Fiber = {
	/** Work tag discriminating the fiber kind (see `FiberTag`). */
	tag: number;
	/** The element type: a function/class for components, a tag string for hosts, or other. */
	type: unknown;
	/** The backing instance: a class instance, a host `HTMLElement`, a portal record, or `null`. */
	stateNode: unknown;
	child: Fiber | null;
	sibling: Fiber | null;
	memoizedProps: unknown;
	memoizedState: unknown;
};

/** The fiber root committed by React; `current` is the root `HostRoot` fiber of the tree. */
export type FiberRoot = {
	current: Fiber;
};

/** React work tags we discriminate on. Values are stable across React 16–18. */
export const FiberTag = {
	FunctionComponent: 0,
	ClassComponent: 1,
	HostRoot: 3,
	HostPortal: 4,
	HostComponent: 5,
	HostText: 6,
} as const;

// Element (not HTMLElement): host nodes may be SVG (icons/charts). getComputedStyle and
// getBoundingClientRect both operate on any Element, so SVG-rooted components must be auditable too.
const isElement = (value: unknown): value is Element => value instanceof Element;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	(typeof value === 'object' && value !== null) ? value as Record<string, unknown> : undefined;

/**
 * Depth-first pre-order walk of a fiber subtree via `child`/`sibling`.
 * `visit` runs for `fiber` and every descendant; siblings of the passed root are NOT followed,
 * so callers can scope a walk to a single subtree by passing `fiber.child`.
 */
export const walkFibers = (fiber: Fiber | null, visit: (fiber: Fiber) => void): void => {
	if (!fiber)
		return;

	visit(fiber);
	walkFibers(fiber.child, visit);
	walkFibers(fiber.sibling, visit);
};

/**
 * Resolve the live DOM node a fiber represents. Edge cases (documented, all handled here):
 * - **host component** (`tag 5`): `stateNode` IS the element → return it.
 * - **portal** (`tag 4`): the rendered content lives in `stateNode.containerInfo` → return that container.
 * - **fragment / composite**: no own node → return the FIRST host descendant only.
 * - **text / null** (`tag 6` / nothing rendered): no element → `null`.
 */
export const domNodeOf = (fiber: Fiber): Element | null => {
	if (isElement(fiber.stateNode))
		return fiber.stateNode;

	if (fiber.tag === FiberTag.HostPortal) {
		const container = asRecord(fiber.stateNode)?.containerInfo;
		return isElement(container) ? container : null;
	}

	let found: Element | null = null;
	walkFibers(fiber.child, candidate => {
		if (found)
			return;

		if (candidate.tag === FiberTag.HostComponent && isElement(candidate.stateNode))
			found = candidate.stateNode;
	});

	return found;
};

/**
 * Extract the normalized component view from a fiber. Class fibers read `props`/`state` off the
 * live instance (`stateNode`); function fibers read `memoizedProps` and have no state.
 */
export const extractComponent = (fiber: Fiber): ExtractedComponent => {
	const type = fiber.type;
	const named = (typeof type === 'function') ? type as {displayName?: string; name?: string} : undefined;
	const name = named?.displayName ?? named?.name;

	const isClass = fiber.tag === FiberTag.ClassComponent;
	const instance = isClass ? asRecord(fiber.stateNode) : undefined;

	return {
		name,
		node: domNodeOf(fiber),
		props: isClass ? asRecord(instance?.props) : asRecord(fiber.memoizedProps),
		state: isClass ? asRecord(instance?.state) : undefined,
	};
};

/** Whether a fiber is an auditable component (function or class) — host/text/root fibers are skipped. */
export const isComponentFiber = (fiber: Fiber): boolean =>
	fiber.tag === FiberTag.FunctionComponent || fiber.tag === FiberTag.ClassComponent;
