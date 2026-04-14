import * as React from 'react';
import {RouteParams} from '@nu-art/ts-common';

export type TS_Route<T extends RouteParams = RouteParams> = {
	key: string;
	path: string;
	enabled?: () => boolean
	element?: React.ReactNode;
	Component?: React.ComponentType<any>;
	paramKeys?: (keyof T)[]
	fallback?: boolean;
	index?: boolean;
	children?: TS_Route<any>[]
}