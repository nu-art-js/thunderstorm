import {BaseUnit} from './BaseUnit';
import {Phase_Install, UnitPhaseImplementor} from './types';
import {Commando} from '@nu-art/commando/core/cli';

export class Unit_Python
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Install]> {

	async install() {
		await Commando.create().append('pip install -r requirements.txt').execute();
	}
}