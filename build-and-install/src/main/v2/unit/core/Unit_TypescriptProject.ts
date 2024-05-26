import { UnitPhaseImplementor } from '../types';
import {Unit_Typescript} from './Unit_Typescript';
import {Phase_Install} from '../../phase';

export class Unit_TypescriptProject
	extends Unit_Typescript
	implements UnitPhaseImplementor<[Phase_Install]> {

	async install() {

	}
}