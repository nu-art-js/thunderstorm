import {BaseUnit, UnitMapper_Base} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';

export type Input = {
	pathToProject: string,
	rules: UnitMapper_Base<BaseUnit<any>>[]
}

export type Result = BaseUnit<any>[]


export type TestSuite_UnitsMapper = TestSuite<Input, Result>;
