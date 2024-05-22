import {Unit_Typescript} from './Unit_Typescript';
import {Phase_Install, UnitPhaseImplementor} from './types';

export class Unit_TypescriptProject
	extends Unit_Typescript
	implements UnitPhaseImplementor<[Phase_Install]> {

	async install() {

	}
}