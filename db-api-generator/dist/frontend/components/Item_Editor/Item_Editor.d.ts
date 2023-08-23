import * as React from 'react';
import { ReactNode } from 'react';
import { ComponentSync, EditableItem } from '@nu-art/thunderstorm/frontend';
import { AssetValueType, DB_Object } from '@nu-art/ts-common';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
type InputProps<Value, Ex> = {
    disabled?: boolean;
    className?: string;
    onBlur?: (value: string) => void;
    onCheck?: (value: boolean) => void;
    readProcessor?: (value: Value) => Ex;
    writeProcessor?: (value: Ex) => Value;
};
export type EditableRef<Item> = {
    editable: EditableItem<Item>;
};
export type Props_ItemEditor<Item> = EditableRef<Item>;
export type State_ItemEditor<Item> = EditableRef<Item>;
export declare class Item_Editor<Item, Props extends {} = {}, State extends {} = {}> extends ComponentSync<Props & Props_ItemEditor<Item>, State & State_ItemEditor<Item>> {
    protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State & State_ItemEditor<Item>>): (State & State_ItemEditor<Item>) | undefined;
    input: <K extends keyof Item, Ex extends string | undefined = string | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex> | undefined) => {
        vertical: (label: string, props?: {
            className: string;
        }) => JSX.Element;
        horizontal: (label: string, props?: {
            className: string;
        }) => JSX.Element;
    };
    inputNumber: <K extends keyof Item, Ex extends number | undefined = number | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex> | undefined) => {
        vertical: (label: string, props?: {
            className: string;
        }) => JSX.Element;
        horizontal: (label: string, props?: {
            className: string;
        }) => JSX.Element;
    };
    inputBoolean: <K extends keyof Item, Ex extends boolean | undefined = boolean | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex> | undefined) => {
        vertical: (label: string, props?: {
            className: string;
        }) => JSX.Element;
        horizontal: (label: string, props?: {
            className: string;
        }) => JSX.Element;
    };
}
export type Props_ItemEditorController<T extends DB_Object> = {
    item: Partial<T> | string;
    module: ModuleFE_BaseApi<T, any>;
    onCompleted?: (item: T) => any | Promise<any>;
    onError?: (err: Error) => any | Promise<any>;
    autoSave?: boolean;
    editor: (editable: EditableItem<T>) => ReactNode;
};
export declare class Item_EditorController<Item extends DB_Object, Props extends Props_ItemEditorController<Item> = Props_ItemEditorController<Item>> extends ComponentSync<Props, State_ItemEditor<Item>> {
    constructor(p: Props);
    private __onItemUpdated;
    protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State_ItemEditor<Item>>): (State_ItemEditor<Item>) | undefined;
    render(): React.ReactNode;
}
export type FormPropV1<T, K extends keyof T, EditorValueType, EditorProps, ValueType extends T[K] = T[K]> = {
    prop: K;
    label?: {
        orientation?: 'horizontal' | 'vertical';
        label: string;
    };
    readProcessor?: (value: EditorValueType) => ValueType;
    writeProcessor?: (value: ValueType) => EditorValueType;
};
export {};
