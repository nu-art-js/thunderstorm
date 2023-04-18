import {TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {QueryParams} from '../../shared';


export type TS_Route<T extends QueryParams = QueryParams> = {
	key: string;
	path: string;
	element?: React.ReactNode;
	Component?: React.ComponentClass<any, any>;
	paramKeys?: (keyof T)[]
	fallback?: boolean;
	index?: boolean;
	children?: TS_Route<any>[]
}

export type TS_RouteTreeNode = {
	key: string;
	relativePath: string;
	element?: React.ReactNode;
	Component?: React.ComponentClass<any, any>;
	children?: TypedMap<TS_RouteTreeNode>
}