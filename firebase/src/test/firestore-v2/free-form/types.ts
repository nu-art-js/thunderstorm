import {CollectionTestInput} from '../_core/consts';
import {TestInputValue} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/testing/types';


export type TestCase_FreeForm = {
	run: () => Promise<any>
}

export type TestModel_FreeForm = TestSuite<TestCase_FreeForm, TestInputValue>;
