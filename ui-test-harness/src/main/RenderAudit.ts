/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger} from '@nu-art/logger';
import {extractComponent, Fiber, isComponentFiber, walkFibers} from './fiber.js';
import {runTier1} from './tier1.js';
import {AuditFailure, AuditTraceEntry, Contract, ContractMap, ExtractedComponent} from './types.js';

/**
 * The render-audit engine. Wired to the DevTools hook via `onCommit`, it walks every committed
 * fiber tree and, for each function/class component, runs the generic Tier-1 layout invariants
 * plus any registered per-component contract. Failures accumulate until `drain()` is called.
 *
 * No assertion scripting, no per-component registration: the fiber walk already sees every
 * committed component. Contracts are an optional, additive layer keyed by component name.
 */
export class RenderAudit
	extends Logger {

	private failures: AuditFailure[] = [];
	private trace: AuditTraceEntry[] = [];
	private readonly contracts: ContractMap = {};
	private scheduled = false;
	private latestRoot: Fiber | null = null;

	constructor() {
		super('UITestHarness-Audit');
	}

	/** Register a contract for a component name. Overwrites any prior contract for that name. */
	readonly registerContract = (name: string, contract: Contract): void => {
		this.contracts[name] = contract;
		this.logDebug(`registered contract — component=${name}`);
	};

	/**
	 * Hook entry point — invoked with the root fiber after each React commit.
	 * Coalesces bursts of commits into a single audit via `requestAnimationFrame`, so audits run
	 * once per frame against the latest tree (and after layout, so box measurements are valid).
	 */
	readonly onCommit = (rootFiber: Fiber): void => {
		this.latestRoot = rootFiber;
		if (this.scheduled)
			return;

		this.scheduled = true;
		requestAnimationFrame(() => {
			this.scheduled = false;
			const root = this.latestRoot;
			if (!root)
				return;

			this.audit(root);
		});
	};

	/** Drain and clear the accumulated failures. */
	readonly drain = (): AuditFailure[] => {
		const drained = this.failures;
		this.failures = [];
		return drained;
	};

	/** Inspect accumulated failures WITHOUT clearing — for observing audit progress (e.g. tests). */
	readonly peek = (): AuditFailure[] => [...this.failures];

	/** Inspect accumulated trace WITHOUT clearing — for observing audit progress (e.g. tests). */
	readonly getTrace = (): readonly AuditTraceEntry[] => [...this.trace];

	/** Drain and clear the accumulated audit trace. */
	readonly drainTrace = (): AuditTraceEntry[] => {
		const drained = this.trace;
		this.trace = [];
		return drained;
	};

	private readonly audit = (root: Fiber): void => {
		let componentFibers = 0;
		walkFibers(root, fiber => {
			if (isComponentFiber(fiber))
				componentFibers++;
		});

		const contractCount = Object.keys(this.contracts).length;
		this.logInfo(`audit start — componentFibers=${componentFibers} contracts=${contractCount}`);
		this.pushTrace({
			name: undefined,
			action: 'audit-start',
			detail: `componentFibers=${componentFibers} contracts=${contractCount}`,
			outcome: 'info',
		});

		let skipped = 0;
		let audited = 0;
		walkFibers(root, fiber => {
			if (!isComponentFiber(fiber))
				return;

			const target = extractComponent(fiber);
			if (target.state?.isLoading === true) {
				skipped++;
				this.logVerbose(`skip — component=${target.name} reason=isLoading`);
				this.pushTrace({
					name: target.name,
					action: 'skip',
					detail: 'isLoading',
					outcome: 'info',
				});
				return;
			}

			audited++;
			this.logDebug(`audit — component=${target.name}`);
			this.evaluate(target);
		});

		this.logInfo(`audit complete — audited=${audited} skipped=${skipped} failures=${this.failures.length}`);
		this.pushTrace({
			name: undefined,
			action: 'audit-complete',
			detail: `audited=${audited} skipped=${skipped} failures=${this.failures.length}`,
			outcome: 'info',
		});
	};

	private readonly evaluate = (target: ExtractedComponent): void => {
		const name = target.name;

		if (target.node) {
			const tier1Failures = runTier1(target.node);
			if (tier1Failures.length === 0) {
				this.logVerbose(`tier1 pass — component=${name}`);
				this.pushTrace({name, action: 'tier1', outcome: 'pass'});
			} else {
				tier1Failures.forEach(detail => {
					this.logDebug(`tier1 fail — component=${name} detail=${detail}`);
					this.pushTrace({name, action: 'tier1', detail, outcome: 'fail'});
					this.pushFailure(name, 'tier1', detail);
				});
			}
		} else
			this.logVerbose(`tier1 skipped — component=${name} reason=no-node`);

		const contract = name ? this.contracts[name] : undefined;
		if (!contract)
			return;

		const detail = contract(target);
		if (detail) {
			this.logDebug(`contract fail — component=${name} detail=${detail}`);
			this.pushTrace({name, action: 'contract', detail, outcome: 'fail'});
			this.pushFailure(name, 'contract', detail);
		} else {
			this.logDebug(`contract pass — component=${name}`);
			this.pushTrace({name, action: 'contract', outcome: 'pass'});
		}
	};

	private readonly pushTrace = (entry: AuditTraceEntry): void => {
		this.trace.push(entry);
	};

	private readonly pushFailure = (name: string | undefined, kind: AuditFailure['kind'], detail: string): void => {
		this.logWarning(`AUDIT FAIL: ${kind} — component=${name} detail=${detail}`);
		this.failures.push({name, kind, detail});
	};
}
