import {UniqueId} from '@nu-art/ts-common';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';

//A result is a map of a dbKey to a list of items in that collection that conflict with the checked item
export type DBEntityDependencyResult = { [dbKey: string]: UniqueId[] }

export type DBEntityDependencies = {
	//The collection key of the checked item
	dbKey: string;
	//A map holding conflicts for each item checked under this collection
	dependencyMap: {
		[entityId: UniqueId]: DBEntityDependencyResult;
	}
}

export type DBEntityDependencyError = ResponseError<'entity-has-dependencies', DBEntityDependencies>