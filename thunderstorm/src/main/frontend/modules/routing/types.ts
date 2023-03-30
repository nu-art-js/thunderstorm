import {TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {QueryParams} from '../../shared';

export type TS_Route<T extends QueryParams = QueryParams> = {
	key: string;
	path: string;
	element?: React.ElementType;
	paramKeys?: (keyof T)[]
	fallback?: boolean;
}

export type TS_RouteTreeNode = {
	key: string;
	relativePath: string;
	element?: React.ElementType;
	children?: TypedMap<TS_RouteTreeNode>
}