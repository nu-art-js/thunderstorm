import {TestSuite} from '@nu-art/ts-common/testing/types';
import {TestInputValue} from '../_entity';
import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_Type_Complex = { '1.0.0': DB_FreeForm }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = string;
type Proto = Proto_DB_Object<DB_FreeForm, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_FreeForm = DBProto<Proto>;
export type UI_FreeForm = DBProto_FreeForm['uiType'];

export type DB_FreeForm = DB_Object & {
	values: string[]
}

export type TestCase_FreeForm = {
	run: () => Promise<any>
}

export type TestModel_FreeForm = TestSuite<TestCase_FreeForm, TestInputValue>;
