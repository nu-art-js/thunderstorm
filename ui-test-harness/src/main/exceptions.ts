/*
 * @nu-art/ui-test-harness - Render/lifecycle exception capture for the render-audit engine
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ExpectedException} from './types.js';

/** A deduped render/lifecycle exception observed during the current audit cycle. */
export type CapturedException = {
	component: string | undefined;
	message: string;
	source: 'console' | 'window' | 'rejection';
};

const REACT_COMPONENT_IN = /The above error occurred in the <([^>]+)> component/i;
const REACT_CAUGHT_BY = /React will try to recreate this component tree.*?<([^>]+)>/i;

const messageOf = (value: unknown): string => {
	if (typeof value === 'string')
		return value;
	if (value instanceof Error)
		return value.message;
	if (typeof value === 'object' && value !== null && 'message' in value)
		return String((value as {message: unknown}).message);
	return String(value);
};

const componentFromConsole = (text: string): string | undefined => {
	const inMatch = REACT_COMPONENT_IN.exec(text);
	if (inMatch?.[1])
		return inMatch[1];

	const caughtMatch = REACT_CAUGHT_BY.exec(text);
	if (caughtMatch?.[1])
		return caughtMatch[1];

	return undefined;
};

const attributionScore = (captured: CapturedException): number =>
	(captured.component ? 2 : 0) + (captured.source === 'console' ? 1 : 0);

/**
 * Captures render/lifecycle exceptions via window error channels and `console.error`.
 * React dev builds emit structured console messages naming the component; window events carry
 * the raw Error. Dedupes per audit cycle; supports allowlisting for negative tests.
 */
export class ExceptionCapture {
	private readonly queue: CapturedException[] = [];
	private readonly cycleSeen = new Set<string>();
	private expected: ExpectedException[] = [];
	private installed = false;

	readonly registerExpected = (rule: ExpectedException): void => {
		this.expected.push(rule);
	};

	readonly beginCycle = (): void => {
		this.cycleSeen.clear();
	};

	/** Returns the first unexpected exception this cycle, preferring React-attributed console errors. */
	readonly firstUnexpected = (): CapturedException | undefined => {
		const unexpected = this.queue
			.filter(captured => !this.isExpected(captured))
			.sort((a, b) => attributionScore(b) - attributionScore(a));

		for (const captured of unexpected) {
			const key = `${captured.component ?? '<unknown>'}:${captured.message}`;
			if (this.cycleSeen.has(key))
				continue;

			this.cycleSeen.add(key);
			return captured;
		}

		return undefined;
	};

	readonly install = (): void => {
		if (this.installed)
			return;

		this.installed = true;

		window.addEventListener('error', event => {
			this.enqueue({
				component: undefined,
				message: messageOf(event.error ?? event.message),
				source: 'window',
			});
		});

		window.addEventListener('unhandledrejection', event => {
			this.enqueue({
				component: undefined,
				message: messageOf(event.reason),
				source: 'rejection',
			});
		});

		const originalConsoleError = console.error.bind(console);
		console.error = (...args: unknown[]) => {
			const text = args.map(messageOf).join(' ');
			const component = componentFromConsole(text);
			const errorArg = args.find((arg): arg is Error => arg instanceof Error);

			if (errorArg) {
				this.enqueue({
					component: undefined,
					message: errorArg.message,
					source: 'console',
				});
			}

			if (component || REACT_COMPONENT_IN.test(text)) {
				this.enqueue({
					component,
					message: errorArg?.message ?? text.slice(0, 512),
					source: 'console',
				});
			}

			originalConsoleError(...args);
		};
	};

	private readonly enqueue = (captured: CapturedException): void => {
		const key = `${captured.component ?? '<unknown>'}:${captured.message}`;
		if (this.queue.some(existing => `${existing.component ?? '<unknown>'}:${existing.message}` === key))
			return;

		this.queue.push(captured);
	};

	private readonly isExpected = (captured: CapturedException): boolean => {
		return this.expected.some(rule => this.matchesExpectedRule(captured, rule));
	};

	private readonly matchesExpectedRule = (captured: CapturedException, rule: ExpectedException): boolean => {
		const hasComponentEvidence = captured.component === rule.component
			|| this.queue.some(other => other.component === rule.component);
		const hasMessageEvidence = captured.message.includes(rule.messageSubstring)
			|| this.queue.some(other => other.message.includes(rule.messageSubstring));

		if (!hasComponentEvidence || !hasMessageEvidence)
			return false;

		if (captured.component === rule.component)
			return true;

		return !captured.component && captured.message.includes(rule.messageSubstring);
	};
}
