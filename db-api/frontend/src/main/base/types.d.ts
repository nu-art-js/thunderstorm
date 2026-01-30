import { ValidatorTypeResolver } from '@nu-art/ts-common';
import { DB_Object, DBConfig } from '../to-refactor/db-types.js';
/**
 * Minimal type definition for BaseDB/BaseApi modules.
 *
 * This is a focused type that contains only what the module needs,
 * decoupled from the full Proto definition. The application level
 * will create this from Proto, but the module doesn't know about Proto.
 *
 * @template DBItem - The full database object type (extends DB_Object)
 * @template UIItem - The UI input type (well-defined at app level, already excludes generated props)
 * @template Validator - The validator function type (matches UIItem)
 * @template UniqueKeys - Array of unique key names
 */
export type ModuleTypes<DBKey extends string = string, DBItem extends DB_Object = any, UIItem extends object = any, Validator extends ValidatorTypeResolver<UIItem> = ValidatorTypeResolver<UIItem>, UniqueKeys extends (keyof DBItem)[] = (keyof DBItem)[]> = {
    readonly dbKey: DBKey;
    readonly dbItem: DBItem;
    readonly uiItem: UIItem;
    readonly validator: Validator;
    readonly uniqueKeys: UniqueKeys;
};
/**
 * Minimal configuration for BaseDB/BaseApi modules.
 *
 * Contains only what the module needs to operate, without Proto dependencies.
 *
 * @template Types - ModuleTypes that define the entity types
 */
export type BaseDBConfig<Types extends ModuleTypes<any, any, any>> = {
    dbKey: Types['dbKey'];
    validator: Types['validator'];
    uniqueKeys: Types['uniqueKeys'];
    versions: string[];
    dbConfig: DBConfig<Types['dbItem']>;
};
