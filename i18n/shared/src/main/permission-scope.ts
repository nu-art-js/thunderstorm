import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_I18nUI = definePermissionScope('i18n-ui', ['view'] as const);
export const PermissionScope_I18nLocale = definePermissionScope('i18n-locale', ['create'] as const);
export const PermissionScope_I18nOverlay = definePermissionScope('i18n-overlay', ['create'] as const);
export const PermissionScope_I18nEdit = definePermissionScope('i18n-edit', ['edit'] as const);
