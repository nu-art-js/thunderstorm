/*
 * @nu-art/consent-shared - Generic consent categories, stored choice and subscriptions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException} from '@nu-art/ts-common';
import type {ConsentCategoryDef, ConsentCategoryKey, ConsentChoice, ConsentSource} from './types.js';

/** Where the choice is kept (localStorage in a browser). Values are strings. */
export type ConsentStorage = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
};

export type ConsentStoreOptions = {
	categories: ConsentCategoryDef[];
	/** Bump to ask everyone again (new purposes, new vendors). */
	policyVersion: number;
	/** A choice older than this is asked again. */
	maxAgeMs: number;
	storage?: ConsentStorage;
	storageKey: string;
	now?: () => number;
};

type Listener = (granted: boolean) => void;
type ChangeListener = (choice: ConsentChoice | undefined) => void;

/**
 * Holds the consent choice: validates it against the categories and policy version, persists it and
 * notifies subscribers per category. Framework-free; ModuleFE_Consent wraps it for the browser.
 *
 * Nothing is granted before an explicit decision. Required categories are always granted.
 */
export class ConsentStore
	implements ConsentSource {

	private readonly options: ConsentStoreOptions;
	private readonly listeners = new Map<ConsentCategoryKey, Set<Listener>>();
	private readonly changeListeners = new Set<ChangeListener>();
	private choice?: ConsentChoice;

	constructor(options: ConsentStoreOptions) {
		const keys = options.categories.map(c => c.key);
		if (new Set(keys).size !== keys.length)
			throw new BadImplementationException(`Duplicate consent category in [${keys.join(', ')}]`);
		if (keys.some(key => !key))
			throw new BadImplementationException('Consent category key must not be empty');

		this.options = options;
		this.choice = this.load();
	}

	getCategories(): ConsentCategoryDef[] {
		return [...this.options.categories];
	}

	/** The current valid choice, or undefined when the visitor must still decide. */
	getChoice(): ConsentChoice | undefined {
		return this.choice && {...this.choice, granted: {...this.choice.granted}};
	}

	hasDecided(): boolean {
		return !!this.choice;
	}

	isGranted(category: ConsentCategoryKey): boolean {
		if (this.isRequired(category))
			return true;

		return this.choice?.granted[category] === true;
	}

	acceptAll(): void {
		this.decide(Object.fromEntries(this.options.categories.map(c => [c.key, true])));
	}

	rejectAll(): void {
		this.decide({});
	}

	/** Saves an explicit per-category choice. Missing categories are not granted. */
	decide(granted: Record<ConsentCategoryKey, boolean>): void {
		const normalized: Record<ConsentCategoryKey, boolean> = {};
		for (const category of this.options.categories)
			normalized[category.key] = category.required ? true : granted[category.key] === true;

		this.apply({policyVersion: this.options.policyVersion, decidedAt: this.now(), granted: normalized});
	}

	/** Withdraws the choice: nothing optional is granted and the visitor is asked again. */
	withdraw(): void {
		this.apply(undefined);
	}

	subscribe(category: ConsentCategoryKey, listener: Listener): () => void {
		let set = this.listeners.get(category);
		if (!set)
			this.listeners.set(category, set = new Set());

		set.add(listener);
		return () => set.delete(listener);
	}

	/** Called after any change (decision or withdrawal), e.g. to show or hide a banner. */
	onChange(listener: ChangeListener): () => void {
		this.changeListeners.add(listener);
		return () => this.changeListeners.delete(listener);
	}

	private apply(next: ConsentChoice | undefined): void {
		const before = new Map(this.options.categories.map(c => [c.key, this.isGranted(c.key)]));
		this.choice = next;
		this.save();

		for (const category of this.options.categories) {
			const granted = this.isGranted(category.key);
			if (granted === before.get(category.key))
				continue;

			this.listeners.get(category.key)?.forEach(listener => listener(granted));
		}

		this.changeListeners.forEach(listener => listener(this.getChoice()));
	}

	private isRequired(category: ConsentCategoryKey): boolean {
		return this.options.categories.some(c => c.key === category && c.required);
	}

	private load(): ConsentChoice | undefined {
		const raw = this.options.storage?.getItem(this.options.storageKey);
		if (!raw)
			return undefined;

		const choice = parseChoice(raw);
		if (!choice || choice.policyVersion !== this.options.policyVersion || this.now() - choice.decidedAt > this.options.maxAgeMs || choice.decidedAt > this.now()) {
			this.options.storage?.removeItem(this.options.storageKey);
			return undefined;
		}

		const granted: Record<ConsentCategoryKey, boolean> = {};
		for (const category of this.options.categories)
			granted[category.key] = category.required ? true : choice.granted[category.key] === true;

		return {...choice, granted};
	}

	private save(): void {
		if (!this.choice)
			return this.options.storage?.removeItem(this.options.storageKey);

		this.options.storage?.setItem(this.options.storageKey, JSON.stringify(this.choice));
	}

	private now(): number {
		return (this.options.now ?? Date.now)();
	}
}

function parseChoice(raw: string): ConsentChoice | undefined {
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null)
			return undefined;

		const {policyVersion, decidedAt, granted} = value as Partial<ConsentChoice>;
		if (typeof policyVersion !== 'number' || typeof decidedAt !== 'number' || typeof granted !== 'object' || granted === null)
			return undefined;

		return {policyVersion, decidedAt, granted};
	} catch {
		return undefined;
	}
}
