import { FirestoreTransaction } from '@nu-art/firebase/backend';
import { DB_Object, DBDef, Default_UniqueKey, Dispatcher, TS_Object, ValidatorTypeResolver } from '@nu-art/ts-common';
import { DB_EntityDependency } from '@nu-art/firebase';
export declare const Const_LockKeys: (keyof DB_Object)[];
export type DBApiBEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
    collectionName: string;
    validator: ValidatorTypeResolver<DBType>;
    uniqueKeys: Ks[];
    lockKeys: (keyof DBType)[];
    itemName: string;
    versions: string[];
    TTL: number;
    lastUpdatedTTL: number;
};
export declare const getModuleBEConfig: <T extends DB_Object, Ks extends keyof T = "_id">(dbDef: DBDef<T, Ks>) => DBApiBEConfig<T, Ks>;
export type CanDeleteDBEntities<AllTypes extends TS_Object, DeleteType extends string = string, ValidateType extends string = string> = {
    __canDeleteEntities: <T extends DeleteType>(type: T, items: (AllTypes[T])[], transaction?: FirestoreTransaction) => Promise<DB_EntityDependency<ValidateType>>;
};
export declare const canDeleteDispatcher: Dispatcher<CanDeleteDBEntities<any, any, string>, "__canDeleteEntities", [type: any, items: any[], transaction?: FirestoreTransaction | undefined], DB_EntityDependency<string>>;
