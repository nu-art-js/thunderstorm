import {StringMap} from '@thunder-storm/common';
import {ProjectConfig_DefaultFileRoutes} from '../../defaults/consts';

export type ProjectConfigV2 = {
	params: StringMap;
	defaultFileRoutes?: ProjectConfig_DefaultFileRoutes;
	//Will be params for creating package.json files
	projectVersion: string;
	thunderstormVersion: string;
}