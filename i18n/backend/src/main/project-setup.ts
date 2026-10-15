import {asDispatchKey} from '@nu-art/ts-common';

/** i18n setup actions on graph_ProjectSetup. They run only when an app root action depends on them. */
export const DispatchKey_LocaleAccess = asDispatchKey('setup.locale-access');
export const DispatchKey_DefaultLocales = asDispatchKey('setup.default-locales');
