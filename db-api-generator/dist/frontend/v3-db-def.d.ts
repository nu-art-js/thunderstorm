import { DBDef_V3, DBProto } from '@nu-art/ts-common';
import { DBConfigV3 } from '@nu-art/thunderstorm/frontend';
export type DBApiFEConfigV3<Proto extends DBProto<any>> = {
    key: string;
    versions: Proto['versions'];
    validator: Proto['modifiablePropsValidator'];
    dbConfig: DBConfigV3<Proto>;
};
export declare const getModuleFEConfigV3: <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>) => DBApiFEConfigV3<Proto>;
