import {ResolvableContent} from '@nu-art/ts-common';
import * as React from 'react';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ModuleFE_v3_BaseDB} from '../../modules/db-api-gen/ModuleFE_v3_BaseDB';
import {TS_Route} from '../../modules/routing';


export type AppToolsScreen = {
	key?: string;
	name: string;
	renderer: React.ComponentType;
	icon?: React.ComponentType; //Icon for rendering in the navigator
	group?: string; //For grouping in the navigator
	children?: TS_Route<any>[]
	modulesToAwait?: ResolvableContent<(ModuleFE_BaseDB<any, any> | ModuleFE_v3_BaseDB<any, any>)[]>;
}

export const ATS_3rd_Party = '3rd Party';
export const ATS_Fullstack = 'Fullstack';
export const ATS_Frontend = 'Frontend';
export const ATS_Backend = 'Backend';
export const ATS_Garbage = 'Garbage';
export const ATS_ToRefactor = 'To Refactor';