import * as React from 'react';
import {DBProto} from '@nu-art/ts-common';

export type ConflictResolutionItem<Proto extends DBProto<any>> = {
	//Key of the DBEntity
	dbKey: Proto['dbKey'];
	//What will be rendered in the conflict resolution panel
	renderer: (instance: Proto['dbType']) => React.ReactNode | undefined;
	//How we render the dbKey in the conflict resolution panel
	collectionRenderer: (dbKey: Proto['dbKey']) => React.ReactNode | undefined;
	//What we filter by in the conflict resolution panel
	filterMapper: (instance: Proto['dbType']) => string[];
}