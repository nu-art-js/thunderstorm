import type {UniqueId} from '@nu-art/ts-common';

export type ScopedAccessIds = Record<string, UniqueId[]>;
export const AccessScope_Self = '_self';

export type DocumentAccessInner = {
	readers: UniqueId[];
	writers: UniqueId[];
	deleters: UniqueId[];
	owners: UniqueId[];
};

export type DocumentAccessFields = {
	__access: DocumentAccessInner;
};

export type DocumentAccessCapabilities = {
	read?: boolean;
	write?: boolean;
	delete?: boolean;
	own?: boolean;
};

export const AllDocumentAccessKeys: (keyof DocumentAccessInner)[] = ['readers', 'writers', 'deleters', 'owners'];

export const CapabilityToAccessKey: Record<keyof DocumentAccessCapabilities, keyof DocumentAccessInner> = {
	read: 'readers',
	write: 'writers',
	delete: 'deleters',
	own: 'owners',
};
