import { DBConfig } from '@nu-art/thunderstorm/frontend';
import { DB_Object, DBDef, Default_UniqueKey, ValidatorTypeResolver } from '@nu-art/ts-common';
export type DBApiFEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
    key: string;
    versions: string[];
    validator: ValidatorTypeResolver<DBType>;
    dbConfig: DBConfig<DBType, Ks>;
};
export declare const getModuleFEConfig: <T extends DB_Object, Ks extends keyof T = "_id">(dbDef: DBDef<T, Ks>) => DBApiFEConfig<T, Ks>;
