import {asDispatchKey, GraphDispatcher} from '@nu-art/ts-common';

export interface OnI18nProjectSetup {
	__onI18nProjectSetup(): Promise<void>;
}

/**
 * i18n's project-setup graph. The app adds it to project setup with composeProjectSetup(graph_I18nProjectSetup).
 * It runs after the SetupTask levels, so permission groups already exist. Nodes bind by key.
 */
export const graph_I18nProjectSetup = new GraphDispatcher<OnI18nProjectSetup, '__onI18nProjectSetup'>('__onI18nProjectSetup', {bindByKey: true});

export const DispatchKey_LocaleAccess = asDispatchKey('setup.locale-access');
export const DispatchKey_DefaultLocales = asDispatchKey('setup.default-locales');
