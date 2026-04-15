import {TestSuite} from '@nu-art/testalot';
import {TestInputValue} from '../_entity/type/types.js';
import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const FreeForm_DbKey = 'free-form';
type DBKey = typeof FreeForm_DbKey;
type VersionTypes_Type_Complex = { '1.0.0': DB_FreeForm };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_FreeForm = DB_Object<DBKey> & {
	values: string[]
};

export type DatabaseDef_FreeForm = DB_Prototype<DB_ProtoSeed<DB_FreeForm, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_FreeForm = DatabaseDef_FreeForm['uiType'];

export type TestCase_FreeForm = {
	run: () => Promise<any>
};

export type TestModel_FreeForm = TestSuite<TestCase_FreeForm, TestInputValue>;
