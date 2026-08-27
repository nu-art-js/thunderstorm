/*
 * @nu-art/ui-test-harness - EMPIRICAL PROBE (not engine code).
 * A throwaway React app + a commit/error RECORDER that wraps the already-installed DevTools hook,
 * to observe exactly what a render/lifecycle exception looks like to the render-audit engine.
 * This file lives only in src/test and touches NO engine source.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import React from 'react';
import {createRoot, Root} from 'react-dom/client';

// ---------------------------------------------------------------------------
// Recorder: wrap the DevTools hook (already wrapped by the engine IIFE) so we
// see every committed fiber root, and walk it ourselves to dump (tag, name).
// We chain on top of the engine's wrapper; we do NOT modify the engine.
// ---------------------------------------------------------------------------

type AnyFiber = {
	tag: number;
	type: unknown;
	stateNode: unknown;
	child: AnyFiber | null;
	sibling: AnyFiber | null;
	memoizedState: unknown;
};

type FiberDump = {
	tag: number;
	name: string;
	stateNode: 'element' | 'instance' | 'null' | 'other';
};

type CommitDump = {
	index: number;
	fibers: FiberDump[];
	/** Captured memoizedState/instance-state of any fiber whose component name is 'ErrBoundary'. */
	boundary?: {hasErrorInMemoizedState: boolean; instanceErrorMessage: string | null};
};

declare global {
	interface Window {
		__REACT_DEVTOOLS_GLOBAL_HOOK__?: {
			onCommitFiberRoot: (rendererID: number, root: {current: AnyFiber}, ...rest: unknown[]) => void;
		};
		__excRecorderInstalled?: boolean;
		__exc: ExcApi;
		__excData: ExcData;
	}
}

type ExcData = {
	commits: CommitDump[];
	consoleErrors: string[];
	windowErrors: string[];
	syncThrows: string[];
	didCatch: {message: string; componentStack: boolean}[];
};

const data: ExcData = {
	commits: [],
	consoleErrors: [],
	windowErrors: [],
	syncThrows: [],
	didCatch: [],
};

const nameOf = (type: unknown): string => {
	if (typeof type === 'string')
		return type;
	if (typeof type === 'function') {
		const fn = type as {displayName?: string; name?: string};
		return fn.displayName ?? fn.name ?? '<anon-fn>';
	}
	if (type === null || type === undefined)
		return '<null-type>';
	if (typeof type === 'object') {
		const rec = type as {displayName?: string; render?: {name?: string}; type?: {name?: string}};
		if (rec.displayName)
			return rec.displayName;
		if (rec.render?.name)
			return `ForwardRef(${rec.render.name})`;
		if (rec.type?.name)
			return `Memo(${rec.type.name})`;
		return '<object-type>';
	}
	return String(type);
};

const classifyStateNode = (stateNode: unknown): FiberDump['stateNode'] => {
	if (stateNode === null || stateNode === undefined)
		return 'null';
	if (typeof Element !== 'undefined' && stateNode instanceof Element)
		return 'element';
	if (typeof stateNode === 'object')
		return 'instance';
	return 'other';
};

const walk = (fiber: AnyFiber | null, visit: (f: AnyFiber) => void): void => {
	if (!fiber)
		return;
	visit(fiber);
	walk(fiber.child, visit);
	walk(fiber.sibling, visit);
};

const recordCommit = (rootCurrent: AnyFiber): void => {
	const fibers: FiberDump[] = [];
	let boundary: CommitDump['boundary'];

	walk(rootCurrent, f => {
		const name = nameOf(f.type);
		fibers.push({tag: f.tag, name, stateNode: classifyStateNode(f.stateNode)});

		if (name === 'ErrBoundary') {
			const memo = f.memoizedState as {error?: unknown} | null;
			const inst = f.stateNode as {state?: {error?: {message?: string} | null}} | null;
			boundary = {
				hasErrorInMemoizedState: !!(memo && memo.error),
				instanceErrorMessage: inst?.state?.error?.message ?? null,
			};
		}
	});

	data.commits.push({index: data.commits.length, fibers, boundary});
};

const installRecorder = (): void => {
	if (window.__excRecorderInstalled)
		return;

	const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
	if (!hook)
		throw new Error('DevTools hook missing — engine IIFE must be injected before this probe');

	const previous = hook.onCommitFiberRoot;
	hook.onCommitFiberRoot = (rendererID, root, ...rest) => {
		previous?.(rendererID, root, ...rest);
		recordCommit(root.current);
	};
	window.__excRecorderInstalled = true;

	// Error channels, observed in-page (the Playwright test ALSO observes pageerror/console).
	window.addEventListener('error', e => data.windowErrors.push(String(e.message)));
	const origConsoleError = console.error.bind(console);
	console.error = (...args: unknown[]) => {
		const msg = args
			.map(a => (typeof a === 'string' ? a : (a as {message?: string})?.message ?? String(a)))
			.join(' ')
			.slice(0, 240);
		data.consoleErrors.push(msg);
		origConsoleError(...args);
	};
};

// ---------------------------------------------------------------------------
// Probe components
// ---------------------------------------------------------------------------

class ThrowInRenderClass
	extends React.Component<{label: string}> {
	render(): React.ReactNode {
		throw new Error('class-render-boom');
	}
}

class ThrowInMountClass
	extends React.Component<{label: string}> {
	componentDidMount(): void {
		throw new Error('class-mount-boom');
	}

	render(): React.ReactNode {
		return <div data-testid="s3-host">mounted-ok</div>;
	}
}

class ThrowInUpdateClass
	extends React.Component<{phase: number}> {
	componentDidUpdate(): void {
		throw new Error('class-update-boom');
	}

	render(): React.ReactNode {
		return <div data-testid="s4-host">phase-{this.props.phase}</div>;
	}
}

function ThrowInRenderFn(): React.ReactNode {
	throw new Error('fn-render-boom');
}

class ErrBoundary
	extends React.Component<{children: React.ReactNode}, {error: {message: string} | null}> {
	state: {error: {message: string} | null} = {error: null};

	static getDerivedStateFromError(error: Error): {error: {message: string}} {
		return {error: {message: error.message}};
	}

	componentDidCatch(error: Error, info: {componentStack?: string}): void {
		data.didCatch.push({message: error.message, componentStack: !!info?.componentStack});
	}

	render(): React.ReactNode {
		if (this.state.error)
			return <div data-testid="boundary-fallback">fallback: {this.state.error.message}</div>;
		return this.props.children;
	}
}

// ---------------------------------------------------------------------------
// Scenario harness
// ---------------------------------------------------------------------------

type ExcApi = {
	reset: () => void;
	getData: () => ExcData;
	s1: () => void;
	s2: () => void;
	s3a: () => void;
	s3b: () => void;
	s4: () => void;
	s4Update: () => void;
	s5a: () => void;
	s5b: () => void;
};

const roots = new Map<string, Root>();

const containerFor = (id: string): HTMLElement => {
	let el = document.getElementById(id);
	if (!el) {
		el = document.createElement('div');
		el.id = id;
		document.body.appendChild(el);
	}
	return el;
};

const rootFor = (id: string): Root => {
	let r = roots.get(id);
	if (!r) {
		r = createRoot(containerFor(id));
		roots.set(id, r);
	}
	return r;
};

/** Render, capturing whether the call threw synchronously (so the page evaluate never rejects). */
const renderGuarded = (id: string, element: React.ReactElement, label: string): void => {
	try {
		rootFor(id).render(element);
	} catch (e) {
		data.syncThrows.push(`${label}: ${(e as Error).message}`);
	}
};

window.__exc = {
	reset: () => {
		data.commits = [];
		data.consoleErrors = [];
		data.windowErrors = [];
		data.syncThrows = [];
		data.didCatch = [];
	},
	getData: () => data,

	// 1. Class throws in render(), NO boundary.
	s1: () => renderGuarded('s1', <div data-testid="s1-wrap"><ThrowInRenderClass label="s1"/></div>, 's1'),

	// 2. Class throws in render(), WITH boundary.
	s2: () => renderGuarded('s2', <ErrBoundary><ThrowInRenderClass label="s2"/></ErrBoundary>, 's2'),

	// 3a. Class throws in componentDidMount(), NO boundary.
	s3a: () => renderGuarded('s3a', <div data-testid="s3a-wrap"><ThrowInMountClass label="s3a"/></div>, 's3a'),

	// 3b. Class throws in componentDidMount(), WITH boundary.
	s3b: () => renderGuarded('s3b', <ErrBoundary><ThrowInMountClass label="s3b"/></ErrBoundary>, 's3b'),

	// 4. Class throws in componentDidUpdate(), WITH boundary. Mount phase 0 first.
	s4: () => renderGuarded('s4', <ErrBoundary><ThrowInUpdateClass phase={0}/></ErrBoundary>, 's4-mount'),
	s4Update: () => renderGuarded('s4', <ErrBoundary><ThrowInUpdateClass phase={1}/></ErrBoundary>, 's4-update'),

	// 5a. Function throws in render(), NO boundary.
	s5a: () => renderGuarded('s5a', <div data-testid="s5a-wrap"><ThrowInRenderFn/></div>, 's5a'),

	// 5b. Function throws in render(), WITH boundary.
	s5b: () => renderGuarded('s5b', <ErrBoundary><ThrowInRenderFn/></ErrBoundary>, 's5b'),
};

installRecorder();
