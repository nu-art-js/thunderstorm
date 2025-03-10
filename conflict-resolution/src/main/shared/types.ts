import * as React from 'react';
import {DBProto} from '@nu-art/ts-common';

export type ConflictResolutionItem<Proto extends DBProto<any>> = {
	//Key of the DBEntity
	dbKey: Proto['dbKey'];
	//What will be rendered in the conflict resolution panel
	renderer: (instance: Proto['dbType']) => React.ReactNode;
	//What we filter by in the conflict resolution panel
	filterMapper: (instance: Proto['dbType']) => string[];
}