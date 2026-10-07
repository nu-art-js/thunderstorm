import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {
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
};

export class ModuleFE_I18n_Class
	extends Module<Config> {

	private localeCode = DefaultLocaleCode;
	private editMode = false;

	constructor() {
		super();
		this.setDefaultConfig({defaultLocaleCode: DefaultLocaleCode});
	}

	protected init() {
		const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(StorageKey_I18nLocale) : undefined;
		this.localeCode = stored || this.config.defaultLocaleCode || DefaultLocaleCode;
		this.applyDocumentLocale();
	}

	getLocaleCode = (): string => this.localeCode;

	isEditMode = (): boolean => this.editMode;

	setLocale = (localeCode: string) => {
		this.localeCode = localeCode;
		if (typeof localStorage !== 'undefined')
			localStorage.setItem(StorageKey_I18nLocale, localeCode);
		this.applyDocumentLocale();
		dispatch_onI18nChanged.dispatchAll();
	};

	setEditMode = (editMode: boolean) => {
		this.editMode = editMode;
		dispatch_onI18nChanged.dispatchAll();
	};

	resolve = (id: I18N_Brand, params?: I18N_Params): string => {
		return resolveI18n({
			id,
			params,
			localeCode: this.localeCode,
			overlayForms: this.overlayFormsFor(id),
		});
	};

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
