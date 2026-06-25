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

type AuditTraceEntry = {
	name: string | undefined;
	action: 'audit-start' | 'skip' | 'tier1' | 'contract' | 'audit-complete';
	detail?: string;
	outcome: 'pass' | 'fail' | 'info';
};

type ExtractedTarget = {
	name: string | undefined;
	node: Element | null;
	props: Record<string, unknown> | undefined;
	state: Record<string, unknown> | undefined;
};

declare global {
	interface Window {
		__uiTestHarness: {
			registerContract: (name: string, contract: (target: ExtractedTarget) => string | undefined) => void;
			drain: () => AuditFailure[];
			peek: () => AuditFailure[];
			drainTrace: () => AuditTraceEntry[];
			getTrace: () => readonly AuditTraceEntry[];
		};
		__harnessTest: {mount: () => void};
		__preCommitCalled?: boolean;
	}
}

/** Wait until Tier-1 has flagged the collapsed probe — proves the rAF audit finished. */
const waitForAudit = (page: import('@playwright/test').Page) =>
	page.waitForFunction(() => window.__uiTestHarness.peek().some(f => f.name === 'CollapsedProbe'));

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
		await waitForAudit(page);
		const failures = await page.evaluate(() => window.__uiTestHarness.drain());

		const contractFailures = failures.filter(f => f.kind === 'contract');
		const tier1Failures = failures.filter(f => f.kind === 'tier1');

		// Exactly the seeded contract failure — the passing contract contributes nothing.
		expect(contractFailures).toEqual([
			{name: 'StatefulProbe', kind: 'contract', detail: 'intentional-contract-violation'}
		]);

		// Tier-1 flags layout/visibility probes; collapsed is the anchor assertion.
		expect(tier1Failures.map(f => f.name)).toContain('CollapsedProbe');
		expect(tier1Failures.map(f => f.name)).toEqual(expect.arrayContaining([
			'CollapsedProbe',
			'HiddenDisplayProbe',
			'HiddenVisibilityProbe',
		]));
		expect(tier1Failures.find(f => f.name === 'CollapsedProbe')?.detail).toContain('collapsed');

		const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
		expect(trace.some(e => e.action === 'audit-start')).toBe(true);
		expect(trace.some(e => e.action === 'audit-complete')).toBe(true);
		expect(trace.filter(e => e.action === 'contract' && e.name === 'StatefulProbe' && e.outcome === 'fail')).toHaveLength(1);
		expect(trace.filter(e => e.action === 'contract' && e.name === 'StatelessProbe' && e.outcome === 'pass')).toHaveLength(1);
		expect(trace.filter(e => e.action === 'tier1' && e.name === 'CollapsedProbe' && e.outcome === 'fail')).toHaveLength(1);
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

		const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
		expect(trace.filter(e => e.action === 'skip' && e.name === 'LoadingProbe')).toHaveLength(1);
		expect(trace.some(e => e.action === 'contract' && e.name === 'LoadingProbe')).toBe(false);
	});

	test('extracts class props from instance and function props from memoizedProps', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', t => {
				if (t.props?.label !== 'stateful')
					return `class props.label expected "stateful", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			harness.registerContract('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `fn props.label expected "stateless", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('extracts state for class components and undefined for function components', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', t => {
				if (t.state?.isLoading !== false)
					return `class state.isLoading expected false, got ${JSON.stringify(t.state?.isLoading)}`;
				return undefined;
			});
			harness.registerContract('StatelessProbe', t => {
				if (t.state !== undefined)
					return `function state expected undefined, got ${JSON.stringify(t.state)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('resolves domNodeOf to the correct host element per probe shape', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			const expectTestId = (expected: string) => (t: ExtractedTarget) => {
				const testId = t.node?.getAttribute('data-testid');
				if (testId !== expected)
					return `node data-testid expected "${expected}", got "${testId ?? 'null'}"`;
				return undefined;
			};
			harness.registerContract('StatefulProbe', expectTestId('stateful'));
			harness.registerContract('StatelessProbe', expectTestId('stateless'));
			harness.registerContract('FragmentProbe', expectTestId('fragment-inner'));
			harness.registerContract('SvgProbe', expectTestId('svg-root'));
			harness.registerContract('PortalProbe', expectTestId('portal-target'));
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('Tier-1 flags display:none and visibility:hidden host nodes', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mount());

		await waitForAudit(page);
		const tier1Failures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'tier1');

		const displayFailure = tier1Failures.find(f => f.name === 'HiddenDisplayProbe');
		const visibilityFailure = tier1Failures.find(f => f.name === 'HiddenVisibilityProbe');

		expect(displayFailure?.detail).toBe('not-visible: display=none');
		expect(visibilityFailure?.detail).toBe('not-visible: visibility=hidden');
	});
});

test.describe('ui-test-harness — DevTools hook install', () => {
	test('chains with a pre-existing onCommitFiberRoot handler', async ({page}) => {
		await page.addInitScript(() => {
			window.__preCommitCalled = false;
			window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
				renderers: new Map(),
				supportsFiber: true,
				inject: () => 42,
				onCommitFiberRoot: () => {
					window.__preCommitCalled = true;
				},
				onCommitFiberUnmount: () => {},
			};
		});
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);

		await page.evaluate(() => {
			window.__uiTestHarness.registerContract('StatefulProbe', () => 'chain-smoke-contract');
			window.__harnessTest.mount();
		});

		await page.waitForFunction(() => window.__preCommitCalled === true);
		await page.waitForFunction(() => window.__uiTestHarness.peek().some(f => f.name === 'StatefulProbe'));

		const failures = await page.evaluate(() => window.__uiTestHarness.drain());
		expect(failures.some(f => f.name === 'StatefulProbe' && f.kind === 'contract')).toBe(true);
	});

	test('double IIFE injection leaves hook wrap idempotent and audit functional', async ({page}) => {
		await page.addInitScript({path: iifePath});
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);

		const hookState = await page.evaluate(() => ({
			wrapped: window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.__uiTestHarnessWrapped === true,
		}));
		expect(hookState.wrapped).toBe(true);

		await page.evaluate(() => {
			window.__uiTestHarness.registerContract('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `props broken after double inject: ${JSON.stringify(t.props)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract' && f.name === 'StatelessProbe');

		expect(contractFailures).toEqual([]);
	});
});
