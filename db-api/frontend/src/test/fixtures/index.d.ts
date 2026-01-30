import { BaseDBConfig, ModuleTypes } from '../../main/base/types.js';
import { CrudApiDefShape } from '../../main/decorators/types.js';
import { DB_Object } from '../../main/to-refactor/db-types.js';
/** Minimal test entity: DB_Object plus a name field. */
export type DB_TestItem = DB_Object & {
    name: string;
};
/** UI input type for tests (excludes generated DB_Object fields for creation/update). */
export type UI_TestItem = Pick<DB_TestItem, '_id' | 'name'> & Partial<Omit<DB_TestItem, '_id' | 'name'>>;
/** Validator that accepts any UI_TestItem for tests. Returns undefined = valid. */
export declare const testItemValidator: (item?: UI_TestItem) => undefined;
/** Validator that always fails. Used by validation playwright test. */
export declare const failingValidator: () => string;
/** ModuleTypes type for the test entity (use in test subclasses and BaseDBConfig). */
export type TestItemTypes = ModuleTypes<'test-item', DB_TestItem, UI_TestItem, typeof testItemValidator, (keyof DB_TestItem)[]>;
/** BaseDBConfig for validation tests (validator always fails). */
export type TestItemTypesFailingValidator = ModuleTypes<'test-item', DB_TestItem, UI_TestItem, typeof failingValidator, (keyof DB_TestItem)[]>;
export declare const testItemBaseDBConfigFailingValidator: BaseDBConfig<TestItemTypesFailingValidator>;
/** BaseDBConfig for the test entity. */
export declare const testItemBaseDBConfig: BaseDBConfig<TestItemTypes>;
/** BaseDBConfig for upgrade test: versions [v1, v0] so v0 items are upgraded to v1. */
export declare const testItemBaseDBConfigUpgrade: BaseDBConfig<TestItemTypes>;
/**
 * Factory for a stub CrudApiDefShape used by decorator and base-api tests.
 * Each slot has method and path; tests can replace or wrap the HTTP client.
 */
export declare function createStubCrudApiDefShape(): CrudApiDefShape;
