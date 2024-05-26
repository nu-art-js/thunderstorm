import {StringMap} from '@nu-art/ts-common';
import {BaseUnit} from '../unit/core';

export type ProjectConfigV2 = {
	units: BaseUnit[];
	params: StringMap;

	//Will be params for creating package.json files
	projectVersion: string;
	thunderstormVersion:string;
}