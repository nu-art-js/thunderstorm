/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {StaticLogger} from '@nu-art/logger';
import {Fiber, FiberRoot} from './fiber.js';

const LogTag = 'UITestHarness';

/**
 * The subset of the React DevTools global hook contract we implement/observe. React probes this
 * object at init: it requires `supportsFiber`, calls `inject()` once (we return a renderer id),
 * and calls `onCommitFiberRoot(rendererID, root)` after every commit.
 */
type DevToolsHook = {
	renderers: Map<number, unknown>;
	supportsFiber: boolean;
	inject: (renderer: unknown) => number;
	onCommitFiberRoot: (rendererID: number, root: FiberRoot, ...rest: unknown[]) => void;
	onCommitFiberUnmount: (rendererID: number, fiber: Fiber) => void;
	/** Our idempotency marker — set once we wrap `onCommitFiberRoot`. */
	__uiTestHarnessWrapped?: boolean;
};

declare global {
	interface Window {
		__REACT_DEVTOOLS_GLOBAL_HOOK__?: DevToolsHook;
	}
}

/**
 * Install (or augment) the React DevTools global hook so that every committed fiber root is
 * forwarded to `onCommit`. MUST run before React initializes / `createRoot` — React reads the
 * hook exactly once at init, so injecting it later misses the renderer registration.
 *
 * Idempotent: a real DevTools hook (or a prior install) is preserved and chained, never replaced,
 * and wrapping happens at most once.
 */
export const installHook = (onCommit: (rootFiber: Fiber) => void): void => {
	const hook: DevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ??= {
		renderers: new Map(),
		supportsFiber: true,
		inject: () => 1,
		onCommitFiberRoot: () => {},
		onCommitFiberUnmount: () => {},
	};

	if (hook.__uiTestHarnessWrapped) {
		StaticLogger.logDebug(LogTag, 'installHook skipped — hook already wrapped');
		return;
	}

	const previous = hook.onCommitFiberRoot;
	hook.onCommitFiberRoot = (rendererID, root, ...rest) => {
		previous?.(rendererID, root, ...rest);
		onCommit(root.current);
	};
	hook.__uiTestHarnessWrapped = true;

	StaticLogger.logInfo(LogTag, 'installed DevTools hook before React init — wrapped=onCommitFiberRoot');
};
