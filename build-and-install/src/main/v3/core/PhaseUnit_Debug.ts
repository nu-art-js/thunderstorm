import {BaseUnit} from './BaseUnit';
import {_keys, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {AllBaiParams, RuntimeParams} from '../../core/params/params';
import {UnitPhaseImplementor} from '../../types/types';
import {Phase} from '../phase';


export type Phase_Help = typeof phase_Help;
export const phaseKey_Help = 'help';
export const phase_Help: Phase<'printHelp'> = {
	key: phaseKey_Help,
	name: 'Help',
	method: 'printHelp',
	filter: () => RuntimeParams.help,
	terminateAfterPhase: true,
};

class _PhaseUnit_Dependencies
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Help]> {

	constructor() {
		super({label: 'Help Printer', key: 'bai-help-printer'});
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
			this.logWarningBold(`${paramGroup}: \n`);
			// commando.append(`echo "${paramGroup}:" \n`);

			paramsByGroup[paramGroup].map(param => {
				const paramKeys = param.keys.join(' | ');
				const paramDescription = param.description.trim().split('\n').join('\n\t\t');
				this.logInfo(`${paramKeys} \n\t\t ${paramDescription} \n`);
				// commando.append(`echo "\n	${param.keys.join(' | ')} \n \t\t${param.description.trim().split('\n').join('\n\t\t')} \n"`);
			});
		});
	}

}


export const PhaseUnit_Debug = new _PhaseUnit_Dependencies();