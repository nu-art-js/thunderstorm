import {UniqueId} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod} from '../types';
import {DB_EntityDependencyV2} from '@nu-art/firebase';

export type CollectionActions_Upgrade = {
	//API to upgrade specific collections
	collections: {
		request: {
			dbKeys: string[]; //List of collection keys to upgrade
			force?: boolean; //Force upgrade the collection
		};
		response: void;
	};
	//API to upgrade all collections
	all: {
		request: {
			force?: boolean; //Force upgrade the collection
		};
		response: void;
	};
}

export type CollectionActions_Check = {
	usage: {
		request: {
			dbKey: string;
			itemIds: UniqueId[];
		};
		response: {
			dependencies: DB_EntityDependencyV2[];
		};
	}
}

export type ApiStruct_CollectionActions = {
	upgrade: {
		collections: BodyApi<CollectionActions_Upgrade['collections']['response'], CollectionActions_Upgrade['collections']['request']>;
		all: BodyApi<CollectionActions_Upgrade['all']['response'], CollectionActions_Upgrade['all']['request']>;
	};
	check: {
		usage: BodyApi<CollectionActions_Check['usage']['response'], CollectionActions_Check['usage']['request']>;
	}
}

export const ApiDef_CollectionActions: ApiDefResolver<ApiStruct_CollectionActions> = {
	upgrade: {
		collections: {method: HttpMethod.POST, path: 'v1/collection-actions/upgrade/collections'},
		all: {method: HttpMethod.POST, path: 'v1/collection-actions/upgrade/all'},
	},
	check: {
		usage: {method: HttpMethod.POST, path: 'v1/collection-actions/check/usage'},
	}
};