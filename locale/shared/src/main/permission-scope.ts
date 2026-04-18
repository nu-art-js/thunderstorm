import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_LocaleUI = definePermissionScope('locale-ui', ['view'] as const);
export const PermissionScope_LocaleEntity = definePermissionScope('locale', ['create'] as const);
export const PermissionScope_LocalizedString = definePermissionScope('localized-string', ['create'] as const);
