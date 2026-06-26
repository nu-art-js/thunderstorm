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
	ForwardRef: 11,
	/** Verified against react-reconciler WorkTags for react@18.3.1 (react-reconciler@0.29.2). */
	SuspenseComponent: 13,
	MemoComponent: 14,
	SimpleMemoComponent: 15,
	/** Verified against react-reconciler WorkTags for react@18.3.1 (react-reconciler@0.29.2). */
	LazyComponent: 16,
	/** React 18 deferred Suspense branches — visible in the committed tree during fallback. */
	OffscreenComponent: 22,
} as const;

type NamedType = {displayName?: string; name?: string};

// Element (not HTMLElement): host nodes may be SVG (icons/charts). getComputedStyle and
// getBoundingClientRect both operate on any Element, so SVG-rooted components must be auditable too.
const isElement = (value: unknown): value is Element => value instanceof Element;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	(typeof value === 'object' && value !== null) ? value as Record<string, unknown> : undefined;

const asNamedType = (value: unknown): NamedType | undefined =>
	(typeof value === 'function') ? value as NamedType : undefined;

const isClassComponentType = (type: unknown): boolean =>
	typeof type === 'function'
	&& (type as {prototype?: {isReactComponent?: unknown}}).prototype?.isReactComponent != null;

const isWrapperComponentTag = (tag: number): boolean =>
	tag === FiberTag.ForwardRef
	|| tag === FiberTag.MemoComponent
	|| tag === FiberTag.SimpleMemoComponent;

const isAuditableComponentTag = (tag: number): boolean =>
	tag === FiberTag.FunctionComponent
	|| tag === FiberTag.ClassComponent
	|| isWrapperComponentTag(tag);

/** Suspense/Lazy/Offscreen are not audit targets; host collection passes through them transparently. */
const isPassThroughBoundaryTag = (tag: number): boolean =>
	tag === FiberTag.SuspenseComponent
	|| tag === FiberTag.LazyComponent
	|| tag === FiberTag.OffscreenComponent;

/**
 * Unwrap memo / forwardRef fiber types to the inner component type used for naming and class detection.
 */
const resolveInnerType = (fiber: Fiber): unknown => {
	const {tag, type} = fiber;
	if (tag === FiberTag.ForwardRef)
		return asRecord(type)?.render ?? type;

	if (tag === FiberTag.MemoComponent || tag === FiberTag.SimpleMemoComponent)
		return asRecord(type)?.type ?? type;

	return type;
};

const resolveNamedType = (fiber: Fiber): NamedType | undefined =>
	asNamedType(resolveInnerType(fiber));

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

const portalContainerOf = (fiber: Fiber): Element | null => {
	const container = asRecord(fiber.stateNode)?.containerInfo;
	return isElement(container) ? container : null;
};

/**
 * Collect every host root owned by `fiber` without crossing into nested component fibers.
 * Returns top-most owned hosts in document order; nested hosts inside an already-collected
 * host are omitted. Portals contribute their `containerInfo` element.
 */
export const ownedHostNodesOf = (fiber: Fiber): Element[] => {
	if (fiber.tag === FiberTag.HostComponent && isElement(fiber.stateNode))
		return [fiber.stateNode];

	if (fiber.tag === FiberTag.HostPortal) {
		const container = portalContainerOf(fiber);
		return container ? [container] : [];
	}

	const nodes: Element[] = [];
	collectOwnedHostRoots(fiber.child, nodes);
	return nodes;
};

const collectOwnedHostRoots = (fiber: Fiber | null, nodes: Element[]): void => {
	let cursor = fiber;
	while (cursor) {
		if (isAuditableComponentTag(cursor.tag)) {
			cursor = cursor.sibling;
			continue;
		}

		if (cursor.tag === FiberTag.HostComponent && isElement(cursor.stateNode)) {
			nodes.push(cursor.stateNode);
			cursor = cursor.sibling;
			continue;
		}

		if (cursor.tag === FiberTag.HostPortal) {
			const container = portalContainerOf(cursor);
			if (container)
				nodes.push(container);
			cursor = cursor.sibling;
			continue;
		}

		if (isPassThroughBoundaryTag(cursor.tag)) {
			collectOwnedHostRoots(cursor.child, nodes);
			cursor = cursor.sibling;
			continue;
		}

		collectOwnedHostRoots(cursor.child, nodes);
		cursor = cursor.sibling;
	}
};

/**
 * Resolve the live DOM node a fiber represents — the first owned host root, if any.
 * Convenience alias for `ownedHostNodesOf(fiber)[0] ?? null`.
 */
export const domNodeOf = (fiber: Fiber): Element | null =>
	ownedHostNodesOf(fiber)[0] ?? null;

/** Hook list head on function / wrapper component fibers — values in call order. */
const readHookStates = (fiber: Fiber): readonly unknown[] | undefined => {
	const values: unknown[] = [];
	let cursor = fiber.memoizedState;
	while (cursor) {
		const hook = asRecord(cursor);
		if (!hook)
			break;

		values.push(hook.memoizedState);
		cursor = hook.next;
	}

	return values.length > 0 ? values : undefined;
};

/**
 * Extract the normalized component view from a fiber. Class fibers read `props`/`state` off the
 * live instance (`stateNode`); function fibers read `memoizedProps` and hook values from `memoizedState`.
 * Memo and forwardRef wrappers are unwrapped for naming; wrapper fibers remain the audit target.
 */
export const extractComponent = (fiber: Fiber): ExtractedComponent => {
	const innerType = resolveInnerType(fiber);
	const named = resolveNamedType(fiber);
	const name = named?.displayName ?? named?.name;

	const isClass = fiber.tag === FiberTag.ClassComponent
		|| (isWrapperComponentTag(fiber.tag) && isClassComponentType(innerType));
	const instance = isClass ? asRecord(fiber.stateNode) : undefined;

	const nodes = ownedHostNodesOf(fiber);

	return {
		name,
		nodes,
		node: nodes[0] ?? null,
		props: isClass ? asRecord(instance?.props) : asRecord(fiber.memoizedProps),
		state: isClass ? asRecord(instance?.state) : undefined,
		hooks: isClass ? undefined : readHookStates(fiber),
	};
};

/** Whether a fiber is an auditable component — function, class, memo, or forwardRef. */
export const isComponentFiber = (fiber: Fiber): boolean =>
	isAuditableComponentTag(fiber.tag);
