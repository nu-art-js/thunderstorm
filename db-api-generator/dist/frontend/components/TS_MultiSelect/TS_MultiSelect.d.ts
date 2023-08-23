import * as React from 'react';
import { Component, ReactNode } from 'react';
import { EditableItem, PartialProps_DropDown } from '@nu-art/thunderstorm/frontend';
import { AssetValueType, DB_Object, PreDB } from '@nu-art/ts-common';
import { PartialProps_GenericDropDown } from '../GenericDropDown';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
export type TS_MultiSelect_Renderer<InnerItem extends DB_Object> = {
    className?: string;
    module: ModuleFE_BaseApi<InnerItem>;
    itemRenderer: (item?: InnerItem, onDelete?: () => Promise<void>) => ReactNode;
    placeholder: string;
    noOptionsRenderer: string;
    createNewItemFromLabel?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<PreDB<InnerItem>>;
    selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>;
    itemResolver?: () => InnerItem[];
};
export type DynamicProps_TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem> = {
    editable: EditableItem<EnclosingItem>;
    prop: AssetValueType<EnclosingItem, K, string[] | undefined>;
};
export type StaticProps_TS_MultiSelect<InnerItem extends DB_Object> = TS_MultiSelect_Renderer<InnerItem>;
export type Props_TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object> = StaticProps_TS_MultiSelect<InnerItem> & DynamicProps_TS_MultiSelect<EnclosingItem, K>;
export declare class TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object> extends Component<Props_TS_MultiSelect<EnclosingItem, K, InnerItem>, any> {
    static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object>(_props: TS_MultiSelect_Renderer<InnerItem>): <EnclosingItem_1, K_1 extends keyof EnclosingItem_1>(props: DynamicProps_TS_MultiSelect<EnclosingItem_1, K_1> & Partial<StaticProps_TS_MultiSelect<InnerItem>>) => JSX.Element;
    render(): JSX.Element;
    private renderSelector;
}
