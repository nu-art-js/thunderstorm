import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {
	ApiDef_I18n,
	textToForms,
	type API_I18n,
	createI18nTranslator,
	i18nOverrideId,
	type I18nLocaleTexts,
	asI18nKey,
	isRtlLanguage,
	languageFromLocaleCode,
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
};

export class ModuleFE_I18n_Class
	extends Module<Config> {

	private localeCode = DefaultLocaleCode;
	private editMode = false;
	private texts: I18nLocaleTexts = {overrides: {}, defaults: {}};
	private catalogLocale?: string;

	constructor() {
		super();
		this.setDefaultConfig({defaultLocaleCode: DefaultLocaleCode});
	}

	protected init() {
		const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(StorageKey_I18nLocale) : undefined;
		this.localeCode = stored || this.config.defaultLocaleCode || DefaultLocaleCode;
		this.applyDocumentLocale();
		void this.loadCatalog();
	}

	getLocaleCode = (): string => this.localeCode;

	isEditMode = (): boolean => this.editMode;

	setLocale = (localeCode: string) => {
		this.localeCode = localeCode;
		if (typeof localStorage !== 'undefined')
			localStorage.setItem(StorageKey_I18nLocale, localeCode);
		this.applyDocumentLocale();
		dispatch_onI18nChanged.dispatchAll();
		void this.loadCatalog();
	};

	setEditMode = (editMode: boolean) => {
		this.editMode = editMode;
		dispatch_onI18nChanged.dispatchAll();
	};

	/** The single resolution path for the active locale. */
	resolve = (id: I18N_Brand, params?: I18N_Params): string => createI18nTranslator(this.localeCode, this.texts).t(id, params);

	/** Alias of resolve for titles, meta and attributes: `placeholder={ModuleFE_I18n.t(i18n_Search)}`. */
	t = (id: I18N_Brand, params?: I18N_Params): string => this.resolve(id, params);

	/** Sets document.title through the resolution path. */
	setDocumentTitle = (id: I18N_Brand, params?: I18N_Params): void => {
		if (typeof document !== 'undefined')
			document.title = this.t(id, params);
	};

	/** The override forms of a key in the active locale, if any (for the editor). */
	overrideFormsFor = (id: I18N_Brand): I18N_Forms | undefined => this.texts.overrides[asI18nKey(id)];

	/** Saves an override for the active locale: one document per (locale, key). */
	saveOverride = async (id: I18N_Brand, forms: I18N_Forms): Promise<void> => {
		const key = asI18nKey(id);
		await ModuleFE_I18nOverlay.upsert({locale: this.localeCode, key, forms});
		this.texts = {...this.texts, overrides: {...this.texts.overrides, [key]: forms}};
		dispatch_onI18nChanged.dispatchAll();
	};

	/** Clears an override by deleting it, so the default shows again. */
	clearOverride = async (id: I18N_Brand): Promise<void> => {
		const key = asI18nKey(id);
		if (this.texts.overrides[key])
			await ModuleFE_I18nOverlay.deleteUnique({_id: i18nOverrideId(this.localeCode, key)});

		const overrides = {...this.texts.overrides};
		delete overrides[key];
		this.texts = {...this.texts, overrides};
		dispatch_onI18nChanged.dispatchAll();
	};

	/** The default forms of a key in the active locale (for the editor). */
	defaultFormsFor = (id: I18N_Brand): I18N_Forms | undefined => textToForms(this.texts.defaults[asI18nKey(id)]);

	/** Loads the active locale's texts (defaults and overrides); texts re-render when they arrive. */
	loadCatalog = async (): Promise<void> => {
		const localeCode = this.localeCode;
		try {
			const texts = await this.fetchCatalog({locale: localeCode});
			if (localeCode !== this.localeCode)
				return;

			this.texts = texts;
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

	activeLocale = (): DB_Locale | undefined => {
		const locales = ModuleFE_Locale.cache.all() as DB_Locale[];
		return locales.find(locale => locale.code === this.localeCode && locale.enabled)
			?? locales.find(locale => locale.code === this.localeCode);
	};
}

export const ModuleFE_I18n = new ModuleFE_I18n_Class();
