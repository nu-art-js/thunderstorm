import type {UniqueId} from '@nu-art/ts-common';

export type DocumentAccessFields = {
	_readers: UniqueId[];
	_writers: UniqueId[];
	_deleters: UniqueId[];
	_owners: UniqueId[];
};

export type DocumentAccessCapabilities = {
	read?: boolean;
	write?: boolean;
	delete?: boolean;
	own?: boolean;
};

export const AllDocumentAccessFieldKeys: (keyof DocumentAccessFields)[] = ['_readers', '_writers', '_deleters', '_owners'];

export const CapabilityToFieldKey: Record<keyof DocumentAccessCapabilities, keyof DocumentAccessFields> = {
	read: '_readers',
	write: '_writers',
	delete: '_deleters',
	own: '_owners',
};
