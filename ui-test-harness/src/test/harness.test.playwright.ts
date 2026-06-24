/*
 * @nu-art/ui-test-harness - Playwright self-test: proves the trigger -> extract -> assert -> drain
 * loop end-to-end against the REAL injected IIFE artifact, with zero Beamz dependency.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const iifePath = resolve(__dirname, '../../dist-iife/harness.iife.js');
const testPagePath = '/src/test/index.html';

type AuditFailure = {name: string | undefined; kind: 'tier1' | 'contract'; detail: string};

declare global {
	interface Window {
		__uiTestHarness: {
			registerContract: (name: string, contract: (target: unknown) => string | undefined) => void;
			drain: () => AuditFailure[];
			peek: () => AuditFailure[];
		};
		__harnessTest: {mount: () => void};
	}
}

test.describe('ui-test-harness — fiber audit self-test', () => {
	// Inject the real shippable bundle BEFORE any page script, so the DevTools hook is in place
	// before the page's React initializes.
	test.beforeEach(async ({page}) => {
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);
		await page.waitForFunction(() => window.__harnessTest !== undefined);
	});

	test('drains exactly the seeded contract failure and the collapsed-node Tier-1 failure', async ({page}) => {
		// One intentionally-failing contract, one passing contract — then trigger the render (commit).
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', () => 'intentional-contract-violation');
			harness.registerContract('StatelessProbe', () => undefined);
			window.__harnessTest.mount();
		});

		// Deterministic: wait until the rAF-debounced audit has actually produced output.
		await page.waitForFunction(() => window.__uiTestHarness.peek().length > 0);
		const failures = await page.evaluate(() => window.__uiTestHarness.drain());

		const contractFailures = failures.filter(f => f.kind === 'contract');
		const tier1Failures = failures.filter(f => f.kind === 'tier1');

		// Exactly the seeded contract failure — the passing contract contributes nothing.
		expect(contractFailures).toEqual([
			{name: 'StatefulProbe', kind: 'contract', detail: 'intentional-contract-violation'}
		]);

		// Tier-1 flags the deliberately collapsed component, and only it.
		expect(tier1Failures.map(f => f.name)).toEqual(['CollapsedProbe']);
		expect(tier1Failures[0].detail).toContain('collapsed');

		// Nothing else leaked in.
		expect(failures).toHaveLength(2);
	});

	test('skips components whose state.isLoading is true', async ({page}) => {
		// A contract that would ALWAYS fail — but LoadingProbe reports isLoading:true and must be skipped,
		// so this contract must never run. StatefulProbe (isLoading:false) is the control: it keeps a failing
		// contract, isolating "skipped" from "contract never registered".
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('LoadingProbe', () => 'must-not-run-while-loading');
			harness.registerContract('StatefulProbe', () => 'control-contract-fires');
			window.__harnessTest.mount();
		});

		// Wait until the control component has been audited, so we know the audit ran fully.
		await page.waitForFunction(() => window.__uiTestHarness.peek().some(f => f.name === 'StatefulProbe'));
		const drainedNames = await page.evaluate(() => window.__uiTestHarness.drain().map(f => f.name));

		// The loading component is skipped (its contract never ran) ...
		expect(drainedNames).not.toContain('LoadingProbe');
		// ... while the non-loading control IS audited (contract fired) — proving skip, not silence.
		expect(drainedNames).toContain('StatefulProbe');
	});
});
