import {StringMap} from '@nu-art/ts-common';
import {BaseUnit} from '../unit/core';
import {ProjectConfig_DefaultFileRoutes} from '../../defaults/consts';

export type ProjectConfigV2 = {
	units: BaseUnit[];
	params: StringMap;
	defaultFileRoutes?: ProjectConfig_DefaultFileRoutes;

	//Will be params for creating package.json files
	projectVersion: string;
	thunderstormVersion: string;
}