import * as React from 'react';
import {QueryParams} from '../../shared';
import {ModuleFE_BaseDB} from '../db-api-gen/ModuleFE_BaseDB';
import {ResolvableContent} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseDB} from '../db-api-gen/ModuleFE_v3_BaseDB';


export type TS_Route<T extends QueryParams = QueryParams> = {
	key: string;
	path: string;
	enabled?: () => boolean
	element?: React.ReactNode;
	Component?: React.ComponentType<any>;
	paramKeys?: (keyof T)[]
	fallback?: boolean;
	index?: boolean;
	children?: TS_Route<any>[]
	modulesToAwait?: (ModuleFE_BaseDB<any, any> | ModuleFE_v3_BaseDB<any, any>)[];
	awaitLoader?: ResolvableContent<React.ReactNode>;
}