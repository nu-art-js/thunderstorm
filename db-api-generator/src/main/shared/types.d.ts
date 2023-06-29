import { DB_Object } from '@nu-art/ts-common';
type TypeOf<ValueType> = ValueType extends any[] ? 'array' : ValueType extends object ? 'object' : ValueType extends string ? 'string' : ValueType extends number ? 'number' : ValueType extends boolean ? 'boolean' : never;
export type MetadataProperty<ValueType> = {
    valueType: TypeOf<ValueType>;
    optional: boolean;
    description: string;
};
export type MetadataObject<T extends any> = {
    [K in keyof T]-?: MetadataNested<T[K]>;
};
export type MetadataNested<T extends any> = T extends (infer I)[] ? MetadataProperty<T> & {
    metadata: Metadata<I>;
} : T extends object ? MetadataProperty<T> & {
    metadata: MetadataObject<T>;
} : MetadataProperty<T>;
export type Metadata<T extends any> = T extends (infer I)[] ? MetadataProperty<T> & {
    metadata: Metadata<I>;
} : T extends object ? MetadataObject<T> : MetadataProperty<T>;
export declare const DB_Object_Metadata: Metadata<DB_Object>;
export {};
