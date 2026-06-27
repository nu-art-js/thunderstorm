/*
 * @nu-art/ui-test-harness - Fiber-driven React render-audit engine (DevTools-hook based, zero React dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger} from '@nu-art/logger';
import {ExceptionCapture} from './exceptions.js';
import {extractComponent, Fiber, isComponentTag, walkFibers} from './fiber.js';
import {
	ExpectedException,
	ExtractedComponent,
	UI_Assertion,
	UI_AssertionFailure,
	UI_AssertionOptions,
	UI_AssertionTrace,
} from './types.js';

/**
 * The render-audit engine. Wired to the DevTools hook via `onCommit`, it walks every committed
 * fiber tree and runs registered per-component assertions against the coherent `(props, state, dom)`.
 * The first assertion failure or first unexpected exception halts further evaluation and is reported
 * via `getFirstFailure()`.
 */
export class UI_AssertionEngine
	extends Logger {

	private firstFailure: UI_AssertionFailure | null = null;
	private trace: UI_AssertionTrace[] = [];
	private readonly assertions: Record<string, {assertion: UI_Assertion; hookKeys?: readonly string[]}> = {};
	private scheduled = false;
	private latestRoot: Fiber | null = null;
	readonly exceptions: ExceptionCapture;

	constructor() {
		super('UITestHarness-Audit');
		this.exceptions = new ExceptionCapture();
		this.exceptions.install();
	}

	/** Register an assertion for a component name. Overwrites any prior assertion for that name. */
	readonly registerAssertion = (
		name: string,
		assertion: UI_Assertion,
		options?: UI_AssertionOptions,
	): void => {
		this.assertions[name] = {
			assertion,
			hookKeys: options?.hookKeys,
		};
		this.logDebug(`registered assertion — component=${name} hookKeys=${options?.hookKeys?.length ?? 0}`);
	};

	/** Register an allowlisted exception so negative/error-handling tests do not halt the run. */
	readonly registerExpectedException = (rule: ExpectedException): void => {
		this.exceptions.registerExpected(rule);
		this.logDebug(`registered expected exception — component=${rule.component}`);
	};

	/** The first failure that halted the run, or `null` when clean so far. */
	readonly getFirstFailure = (): UI_AssertionFailure | null => this.firstFailure;

	/**
	 * Hook entry point — invoked with the root fiber after each React commit.
	 * Coalesces bursts of commits into a single run via `requestAnimationFrame`.
	 */
	readonly onCommit = (rootFiber: Fiber): void => {
		this.latestRoot = rootFiber;
		if (this.scheduled)
			return;

		this.scheduled = true;
		const run = (): void => {
			this.scheduled = false;
			const root = this.latestRoot;
			if (!root)
				return;

			this.runAssertions(root);
		};

		if (document.hidden)
			setTimeout(run, 0);
		else
			requestAnimationFrame(run);
	};

	/** Inspect accumulated trace WITHOUT clearing — for observing run progress (e.g. tests). */
	readonly getTrace = (): readonly UI_AssertionTrace[] => [...this.trace];

	/** Drain and clear the accumulated trace. */
	readonly drainTrace = (): UI_AssertionTrace[] => {
		const drained = this.trace;
		this.trace = [];
		return drained;
	};

	private readonly runAssertions = (root: Fiber): void => {
		if (this.firstFailure)
			return;

		this.exceptions.beginCycle();

		let componentFibers = 0;
		const toAssert: ExtractedComponent[] = [];

		walkFibers(root, fiber => {
			if (!isComponentTag(fiber.tag))
				return;

			componentFibers++;
			toAssert.push(extractComponent(fiber, name => name != null && name in this.assertions));
		});

		const assertionCount = Object.keys(this.assertions).length;
		this.logInfo(`run start — componentFibers=${componentFibers} assertions=${assertionCount}`);
		this.pushTrace({
			name: undefined,
			action: 'run-start',
			detail: `componentFibers=${componentFibers} assertions=${assertionCount}`,
			outcome: 'info',
		});

		let asserted = 0;
		for (const target of toAssert) {
			if (this.firstFailure)
				break;

			asserted++;
			this.logDebug(`assert — component=${target.name}`);
			this.evaluate(target);
		}

		if (!this.firstFailure) {
			const unexpected = this.exceptions.firstUnexpected();
			if (unexpected) {
				this.halt({
					name: unexpected.component,
					state: undefined,
					kind: 'exception',
					detail: unexpected.message,
				});
			}
		}

		const halted = this.firstFailure !== null;
		this.logInfo(`run complete — asserted=${asserted} halted=${halted}`);
		this.pushTrace({
			name: undefined,
			action: 'run-complete',
			detail: `asserted=${asserted} halted=${halted}`,
			outcome: halted ? 'halt' : 'info',
		});
	};

	private readonly evaluate = (target: ExtractedComponent): void => {
		const name = target.name;
		if (!name)
			return;

		const registration = this.assertions[name];
		if (!registration)
			return;

		const prepared = this.prepareTarget(target, registration.hookKeys);
		if (this.firstFailure)
			return;

		const detail = registration.assertion(prepared);
		if (!detail) {
			this.logDebug(`assertion pass — component=${name}`);
			this.pushTrace({name, action: 'assertion', outcome: 'pass'});
			return;
		}

		this.logDebug(`assertion fail — component=${name} detail=${detail}`);
		this.pushTrace({name, action: 'assertion', detail, outcome: 'fail'});
		this.halt({
			name,
			state: prepared.state,
			kind: 'assertion',
			detail,
		});
	};

	private readonly prepareTarget = (
		target: ExtractedComponent,
		hookKeys: readonly string[] | undefined,
	): ExtractedComponent => {
		if (!hookKeys)
			return target;

		const hooks = target.hooks ?? [];
		if (hookKeys.length !== hooks.length) {
			const detail = `hooks changed for ${target.name} — update its key map (declared ${hookKeys.length}, observed ${hooks.length})`;
			this.pushTrace({name: target.name, action: 'hook-drift', detail, outcome: 'fail'});
			this.halt({
				name: target.name,
				state: undefined,
				kind: 'hook-drift',
				detail,
			});
			return target;
		}

		const namedState = Object.fromEntries(hookKeys.map((key, index) => [key, hooks[index]]));
		return {...target, state: namedState};
	};

	private readonly halt = (failure: UI_AssertionFailure): void => {
		if (this.firstFailure)
			return;

		this.logWarning(`ASSERTION HALT: ${failure.kind} — component=${failure.name} detail=${failure.detail}`);
		this.firstFailure = failure;

		if (failure.kind === 'exception') {
			this.pushTrace({
				name: failure.name,
				action: 'exception',
				detail: failure.detail,
				outcome: 'halt',
			});
		}
	};

	private readonly pushTrace = (entry: UI_AssertionTrace): void => {
		this.trace.push(entry);
	};
}
