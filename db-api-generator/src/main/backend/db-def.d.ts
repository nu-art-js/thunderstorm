import { DBDef, Default_UniqueKey } from '..';
import { DB_Object, Dispatcher, TS_Object, ValidatorTypeResolver } from '@nu-art/ts-common';
import { FirestoreTransaction } from '@nu-art/firebase/backend';
export declare const Const_LockKeys: (keyof DB_Object)[];
export type DBApiBEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
    collectionName: string;
    validator: ValidatorTypeResolver<DBType>;
    uniqueKeys: Ks[];
    lockKeys: (keyof DBType)[];
    itemName: string;
    versions: string[];
};
export declare const getModuleBEConfig: <T extends DB_Object>(dbDef: DBDef<T>) => DBApiBEConfig<T, "_id">;
export type DB_EntityDependency<Type extends string = string> = {
    collectionKey: Type;
    conflictingIds: string[];
};
export type CanDeleteDBEntities<AllTypes extends TS_Object, DeleteType extends string = string, ValidateType extends string = string> = {
    __canDeleteEntities: <T extends DeleteType>(type: T, items: (AllTypes[T])[], transaction?: FirestoreTransaction) => Promise<DB_EntityDependency<ValidateType>>;
};
export declare const canDeleteDispatcher: Dispatcher<CanDeleteDBEntities<any, any, string>, "__canDeleteEntities", [type: any, items: any[], transaction?: FirestoreTransaction | undefined], DB_EntityDependency<string>>;
