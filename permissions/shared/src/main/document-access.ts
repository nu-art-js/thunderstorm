import type {UniqueId} from '@nu-art/ts-common';

export type ScopedAccessIds = Record<string, UniqueId[]>;
export const AccessScope_Self = '_self';

export type DocumentAccessInner = {
	readers: UniqueId[];
	writers: UniqueId[];
	creators: UniqueId[];
	deleters: UniqueId[];
	owners: UniqueId[];
};

export type DocumentAccessFields = {
	__access: DocumentAccessInner;
};

export type DocumentAccessCapabilities = {
	read?: boolean;
	write?: boolean;
	create?: boolean;
	delete?: boolean;
	own?: boolean;
};

export const AllDocumentAccessKeys: (keyof DocumentAccessInner)[] = ['readers', 'writers', 'creators', 'deleters', 'owners'];

export const CapabilityToAccessKey: Record<keyof DocumentAccessCapabilities, keyof DocumentAccessInner> = {
	read: 'readers',
	write: 'writers',
	create: 'creators',
	delete: 'deleters',
	own: 'owners',
};
