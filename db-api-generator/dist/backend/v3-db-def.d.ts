import { DB_Object, DBDef_V3, DBProto } from '@nu-art/ts-common';
export declare const Const_LockKeys: (keyof DB_Object)[];
export type DBApiBEConfigV3<Proto extends DBProto<any>> = {
    collectionName: string;
    validator: [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']] | Proto['generatedPropsValidator'] & Proto['modifiablePropsValidator'];
    uniqueKeys: Proto['uniqueKeys'];
    itemName: string;
    versions: Proto['versions'];
    TTL: number;
    lastUpdatedTTL: number;
    lockKeys?: Proto['lockKeys'];
};
export declare const getDbDefValidator: <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>) => [Proto["generatedPropsValidator"], Proto["modifiablePropsValidator"]] | (Proto["generatedPropsValidator"] & Proto["modifiablePropsValidator"]);
export declare const getModuleBEConfigV3: <Proto extends DBProto<any, any, any>>(dbDef: DBDef_V3<Proto>) => DBApiBEConfigV3<Proto>;
