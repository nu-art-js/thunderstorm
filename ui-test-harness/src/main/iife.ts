/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Side-effect entry point for the self-contained IIFE build (Playwright injection target).
 * No exports: it installs the hook and publishes a singleton audit on `window`, before any
 * page script runs. The programmatic ESM surface lives in `index.ts`.
 */

import {installHook} from './install.js';
import {UI_AssertionEngine} from './UI_AssertionEngine.js';

declare global {
	interface Window {
		__uiTestHarness?: UI_AssertionEngine;
	}
}

const audit = window.__uiTestHarness ?? new UI_AssertionEngine();
installHook(audit.onCommit);
window.__uiTestHarness = audit;
