import { DBIndex } from '@nu-art/thunderstorm';
import { DB_Object, OmitDBObject, ValidatorTypeResolver } from '@nu-art/ts-common';
import { Metadata } from './types';
export type Default_UniqueKey = '_id';
export declare const Const_UniqueKey = "_id";
export declare const DefaultDBVersion = "1.0.0";
export type DBDef<T extends DB_Object, Ks extends keyof T = Default_UniqueKey> = {
    validator: ValidatorTypeResolver<OmitDBObject<T>>;
    dbName: string;
    entityName: string;
    lockKeys?: (keyof T)[];
    uniqueKeys?: Ks[];
    versions?: string[];
    indices?: DBIndex<T>[];
    metadata?: Metadata<OmitDBObject<T>>;
    generatedProps?: (keyof T)[];
};
