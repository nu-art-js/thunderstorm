/*
 * @nu-art/consent-frontend - Consent module and GDPR banner for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import {
	ConsentStore,
	DefaultConsentCategories,
	type ConsentCategoryDef,
	type ConsentCategoryKey,
	type ConsentChoice,
	type ConsentSource,
	type ConsentStorage,
} from '@nu-art/consent-shared';

type Config = {
	/** Categories offered to the visitor. Defaults: necessary (required), functional, analytics, marketing. */
	categories: ConsentCategoryDef[];
	/** Bump when purposes or vendors change; everyone is asked again. */
	policyVersion: number;
	/** Re-ask after this long. Default 365 days. */
	maxAgeMs: number;
	storageKey: string;
	/** Linked from the banner. Required. */
	privacyPolicyUrl: string;
};

const browserStorage = (): ConsentStorage | undefined => {
	try {
		return typeof localStorage === 'undefined' ? undefined : localStorage;
	} catch {
		// Storage blocked (privacy mode, sandboxed iframe): the choice lives for this page only.
		return undefined;
	}
};

/**
 * The app's consent state. Implements ConsentSource, so consent-aware libraries (e.g. GA4) take this
 * module without depending on this package.
 *
 * Nothing optional is granted before the visitor decides. The choice is kept in localStorage (the
 * consent record itself is strictly necessary storage).
 */
export class ModuleFE_Consent_Class
	extends Module<Config>
	implements ConsentSource {

	private store?: ConsentStore;
	private settingsListeners = new Set<() => void>();

	constructor() {
		super();
		this.setDefaultConfig({
			categories: DefaultConsentCategories,
			policyVersion: 1,
			maxAgeMs: 365 * 24 * 60 * 60 * 1000,
			storageKey: 'thunderstorm-consent',
		});
	}

	protected init() {
		if (!this.config.privacyPolicyUrl)
			throw new ImplementationMissingException('ModuleFE_Consent config is missing privacyPolicyUrl');

		this.getStore();
	}

	getPrivacyPolicyUrl = (): string => this.config.privacyPolicyUrl;
	getCategories = (): ConsentCategoryDef[] => this.getStore().getCategories();
	getChoice = (): ConsentChoice | undefined => this.getStore().getChoice();
	hasDecided = (): boolean => this.getStore().hasDecided();
	isGranted = (category: ConsentCategoryKey): boolean => this.getStore().isGranted(category);
	acceptAll = (): void => this.getStore().acceptAll();
	rejectAll = (): void => this.getStore().rejectAll();
	decide = (granted: Record<ConsentCategoryKey, boolean>): void => this.getStore().decide(granted);
	withdraw = (): void => this.getStore().withdraw();
	subscribe = (category: ConsentCategoryKey, listener: (granted: boolean) => void): () => void => this.getStore().subscribe(category, listener);
	onChange = (listener: (choice: ConsentChoice | undefined) => void): () => void => this.getStore().onChange(listener);

	/** Re-opens the banner with the per-category choices (for a "Cookie settings" footer link). */
	openSettings = (): void => this.settingsListeners.forEach(listener => listener());

	onOpenSettings = (listener: () => void): () => void => {
		this.settingsListeners.add(listener);
		return () => this.settingsListeners.delete(listener);
	};

	private getStore(): ConsentStore {
		return this.store ??= new ConsentStore({
			categories: this.config.categories,
			policyVersion: this.config.policyVersion,
			maxAgeMs: this.config.maxAgeMs,
			storageKey: this.config.storageKey,
			storage: browserStorage(),
		});
	}
}

export const ModuleFE_Consent = new ModuleFE_Consent_Class();
