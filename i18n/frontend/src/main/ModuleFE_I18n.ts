import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {ModuleFE_PermissionsAssert} from '@nu-art/permissions-frontend';
import {
	ApiDef_I18n,
	detectLocale,
	I18nLocaleParam,
	matchSupportedLocale,
	PermissionScope_I18nEdit,
	textToForms,
	type API_I18n,
	type I18N_LocaleCatalog,
	asI18nKey,
	isRtlLanguage,
	languageFromLocaleCode,
	resolveI18n,
	type I18N_Brand,
	type I18N_Forms,
	type I18N_Params,
	type DB_Locale,
} from '@nu-art/i18n-shared';
import {ModuleFE_Locale} from './_entity/locale/ModuleFE_Locale.js';
import {ModuleFE_I18nOverlay} from './_entity/overlay/ModuleFE_I18nOverlay.js';

export const StorageKey_I18nLocale = 'thunderstorm-i18n-locale';
export const DefaultLocaleCode = 'en_US';

export interface OnI18nChanged {
	__onI18nChanged: () => void;
}

export const dispatch_onI18nChanged = new ThunderDispatcher<OnI18nChanged, '__onI18nChanged'>('__onI18nChanged');

type Config = {
	defaultLocaleCode: string;
	/** Enabled locale codes used for detection; defaults to the default locale only. */
	supportedLocales?: string[];
	countryLanguages?: Record<string, string>;
	timeZoneCountries?: Record<string, string>;
};

export class ModuleFE_I18n_Class
	extends Module<Config> {

	private localeCode = DefaultLocaleCode;
	private editMode = false;
	private catalog: I18N_LocaleCatalog = {};
	private catalogLocale?: string;

	constructor() {
		super();
		this.setDefaultConfig({defaultLocaleCode: DefaultLocaleCode});
	}

	protected init() {
		this.localeCode = this.initialLocale();
		this.applyDocumentLocale();
		void this.loadCatalog();
	}

	/**
	 * Explicit choice first (`?lang=` in the URL, then the choice remembered from setLocale), otherwise
	 * detection: browser language, then time zone, then the app default. No cookies are involved.
	 */
	private initialLocale(): string {
		const supported = this.supportedLocales();
		const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get(I18nLocaleParam) : undefined;
		const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(StorageKey_I18nLocale) : undefined;
		const explicit = matchSupportedLocale(fromUrl, supported) ?? matchSupportedLocale(stored, supported);
		if (explicit)
			return explicit;

		return detectLocale({
			supported,
			browserLanguages: typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [],
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			appDefault: this.config.defaultLocaleCode || DefaultLocaleCode,
			countryLanguages: this.config.countryLanguages,
			timeZoneCountries: this.config.timeZoneCountries,
		});
	}

	private supportedLocales(): string[] {
		return this.config.supportedLocales ?? [this.config.defaultLocaleCode || DefaultLocaleCode];
	}

	/** The explicit choice as a request param, for APIs that render text: `{lang: 'nl'}`. */
	localeParam = (): Record<typeof I18nLocaleParam, string> => ({[I18nLocaleParam]: this.localeCode});

	getLocaleCode = (): string => this.localeCode;

	isEditMode = (): boolean => this.editMode;

	/** Edit mode needs the i18n-edit scope; per-locale write rights are enforced by the backend. */
	canEdit = (): boolean => ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_I18nEdit, 'edit');

	setLocale = (localeCode: string) => {
		this.localeCode = localeCode;
		if (typeof localStorage !== 'undefined')
			localStorage.setItem(StorageKey_I18nLocale, localeCode);
		this.applyDocumentLocale();
		dispatch_onI18nChanged.dispatchAll();
		void this.loadCatalog();
	};

	setEditMode = (editMode: boolean) => {
		if (editMode && !this.canEdit()) {
			this.logWarning('Edit mode requires the i18n-edit scope');
			return;
		}

		this.editMode = editMode;
		dispatch_onI18nChanged.dispatchAll();
	};

	resolve = (id: I18N_Brand, params?: I18N_Params): string => {
		return resolveI18n({
			id,
			params,
			localeCode: this.localeCode,
			override: this.overlayFormsFor(id),
			defaultText: this.catalog[asI18nKey(id)],
		});
	};

	/** The default forms of a key in the active locale (for the editor). */
	defaultFormsFor = (id: I18N_Brand): I18N_Forms | undefined => textToForms(this.catalog[asI18nKey(id)]);

	/** Loads the active locale's defaults; texts re-render when it arrives. */
	loadCatalog = async (): Promise<void> => {
		const localeCode = this.localeCode;
		try {
			const catalog = await this.fetchCatalog({locale: localeCode});
			if (localeCode !== this.localeCode)
				return;

			this.catalog = catalog;
			this.catalogLocale = localeCode;
			dispatch_onI18nChanged.dispatchAll();
		} catch (e) {
			this.logWarning(`Failed to load i18n defaults for '${localeCode}'`, e as Error);
		}
	};

	isCatalogLoaded = (): boolean => this.catalogLocale === this.localeCode;

	@ApiCaller(ApiDef_I18n.catalog, {httpClient: () => HttpClient.default})
	protected async fetchCatalog(params: API_I18n['catalog']['Params']): Promise<API_I18n['catalog']['Response']> {
		void params;
		return undefined as unknown as API_I18n['catalog']['Response'];
	}

	applyDocumentLocale = () => {
		if (typeof document === 'undefined')
			return;
		const language = languageFromLocaleCode(this.localeCode);
		document.documentElement.lang = language;
		document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
	};

	private overlayFormsFor(id: I18N_Brand): I18N_Forms | undefined {
		const locale = this.activeLocale();
		if (!locale)
			return undefined;
		const key = asI18nKey(id);
		const overlay = ModuleFE_I18nOverlay.cache.all().find(row => row.key === key && row.localeId === locale._id);
		return overlay?.forms;
	}

	activeLocale = (): DB_Locale | undefined => {
		const locales = ModuleFE_Locale.cache.all() as DB_Locale[];
		return locales.find(locale => locale.code === this.localeCode && locale.enabled)
			?? locales.find(locale => locale.code === this.localeCode);
	};
}

export const ModuleFE_I18n = new ModuleFE_I18n_Class();
