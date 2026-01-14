import {_keys, LogLevel, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {BaseCliParam, CliParams} from '@nu-art/cli-params';
import {AllBaiParams, BaiParam_AllUnits, BaiParam_NoBuild, BaiParam_Prepare} from './params.js';
import {UnitPhaseImplementor} from './types.js';
import {Phase} from '../phases/definitions/index.js';
import {ProjectUnit} from '../units/index.js';

export const BaiParam_Help: BaseCliParam<'help', boolean> = {
	keys: ['--help', '-h'],
	keyName: 'help',
	type: 'boolean',
	group: 'General',
	description: 'This help menu',
	dependencies: [{param: BaiParam_NoBuild, value: true}, {param: BaiParam_Prepare, value: false}, {param: BaiParam_AllUnits, value: true}],
};

const AllBaiParams_Help = [...AllBaiParams, BaiParam_Help];
export type Help_BaiParams = CliParams<typeof AllBaiParams_Help>;

export type Phase_Help = typeof phase_Help;
export const phaseKey_Help = 'help';
export const phase_Help: Phase<'printHelp'> = {
	key: phaseKey_Help,
	name: 'Help',
	method: 'printHelp',
	filter: (params) => (params as Help_BaiParams).help,
};

const config = {key: 'help-printer', fullPath: process.cwd(), relativePath: '.', dependencies: {}, label: 'Help Printer'};

class _Unit_HelpPrinter
	extends ProjectUnit
	implements UnitPhaseImplementor<[Phase_Help]> {

	constructor() {
		super(config);
		this.setMinLevel(LogLevel.Verbose);
	}

	async printHelp() {
		this.logInfo('Build and install parameters:');
		const noGroupConst = 'No Group';

		//Resolve all params by group
		const paramsByGroup: TypedMap<BaseCliParam<string, any>[]> = reduceToMap(AllBaiParams, param => param.group ?? noGroupConst, (item, index, mapper) => {
			mapper[item.group ?? noGroupConst] = [...mapper[item.group ?? noGroupConst] ?? [], item];
			return mapper[item.group ?? noGroupConst];
		});

		_keys(paramsByGroup).map(paramGroup => {
			this.logErrorBold(`${paramGroup}: \n`);
			// commando.append(`echo "${paramGroup}:" \n`);

			paramsByGroup[paramGroup].map(param => {
				const paramKeys = param.keys.join(' | ');
				const paramDescription = param.description.trim().split('\n').join('\n\t\t');
				this.logDebug(`${paramKeys}`);
				this.logVerbose(`\t${paramDescription}\n`);
				// commando.append(`echo "\n	${param.keys.join(' | ')} \n \t\t${param.description.trim().split('\n').join('\n\t\t')} \n"`);
			});
		});
	}
}


export const Unit_HelpPrinter = new _Unit_HelpPrinter();