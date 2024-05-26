import { Phase_Install } from '../../phase';
import { UnitPhaseImplementor } from '../types';
import {BaseUnit} from './BaseUnit';
import {Commando} from '@nu-art/commando/core/cli';

export class Unit_Python
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Install]> {

	async install() {
		await Commando.create().append('pip install -r requirements.txt').execute();
	}
}