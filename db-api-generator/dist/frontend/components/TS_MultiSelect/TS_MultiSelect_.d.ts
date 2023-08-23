import * as React from 'react';
import { Component, ReactNode } from 'react';
import { EditableItem, PartialProps_DropDown } from '@nu-art/thunderstorm/frontend';
import { AssetValueType } from '@nu-art/ts-common';
import { PartialProps_GenericDropDown } from '../GenericDropDown';
export type TS_MultiSelect_Renderer_<InnerItem> = {
    className?: string;
    itemRenderer: (item?: InnerItem, onDelete?: () => Promise<void>) => ReactNode;
    placeholder: string;
    noOptionsRenderer: string;
    createNewItemFromLabel?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<InnerItem>;
    selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>;
    itemResolver?: () => InnerItem[];
};
export type DynamicProps_TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem> = {
    editable: EditableItem<EnclosingItem>;
    prop: AssetValueType<EnclosingItem, K, any[]>;
};
export type StaticProps_TS_MultiSelect_<InnerItem> = TS_MultiSelect_Renderer_<InnerItem>;
export type Props_TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem, InnerItem> = StaticProps_TS_MultiSelect_<InnerItem> & DynamicProps_TS_MultiSelect_<EnclosingItem, K>;
export declare class TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem, InnerItem> extends Component<Props_TS_MultiSelect_<EnclosingItem, K, InnerItem>, any> {
    static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerItem>(_props: TS_MultiSelect_Renderer_<InnerItem>): <EnclosingItem_1, K_1 extends keyof EnclosingItem_1>(props: DynamicProps_TS_MultiSelect_<EnclosingItem_1, K_1> & Partial<StaticProps_TS_MultiSelect_<InnerItem>>) => JSX.Element;
    render(): JSX.Element;
    private renderSelector;
}
