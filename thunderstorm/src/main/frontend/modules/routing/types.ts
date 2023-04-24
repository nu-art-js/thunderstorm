import * as React from 'react';
import {QueryParams} from '../../shared';


export type TS_Route<T extends QueryParams = QueryParams> = {
	key: string;
	path: string;
	element?: React.ReactNode;
	Component?: React.ComponentType<any>;
	paramKeys?: (keyof T)[]
	fallback?: boolean;
	index?: boolean;
	children?: TS_Route<any>[]
}