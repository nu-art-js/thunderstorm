import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {Tests_UnitsDependencyMapper} from './UnitsDependencyMapper';
import {Tests_UnitsDependencyFilter} from './UnitsDependencyFilter';
import {Tests_UnitsReverseDependency} from './UnitsReverseMapper';


describe('UnitsDependencyMapper', () => {
	testSuiteTester(Tests_UnitsDependencyMapper);
});

describe('UnitsDependencyFilter', () => {
	testSuiteTester(Tests_UnitsDependencyFilter);
});

describe('UnitsReverseDependency', () => {
	testSuiteTester(Tests_UnitsReverseDependency);
});
