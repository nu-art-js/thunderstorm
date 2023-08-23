/// <reference types="react" />
import { DB_Object, PreDB } from '@nu-art/ts-common';
import { MultiSelect_Selector, StaticProps_TS_MultiSelect_V2 } from '@nu-art/thunderstorm/frontend/components/TS_MultiSelect';
import { ComponentSync } from '@nu-art/thunderstorm/frontend';
import { PartialProps_GenericDropDown } from '../GenericDropDown';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
type Props<DBType extends DB_Object> = {
    selector: MultiSelect_Selector<string>;
    uiSelector: ((props: PartialProps_GenericDropDown<DBType>) => JSX.Element);
};
export type MultiSelectDropDownProps<DBType extends DB_Object, Ks extends keyof PreDB<DBType>> = {
    module: ModuleFE_BaseApi<DBType, Ks>;
    itemRenderer: (item?: Readonly<DBType>, onDelete?: () => Promise<void>) => JSX.Element;
    uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element;
};
export declare class DBItemDropDownMultiSelector<DBType extends DB_Object> extends ComponentSync<Props<DBType>> {
    static selector: <DBType_1 extends DB_Object>(uiSelector: (props: PartialProps_GenericDropDown<DBType_1>) => JSX.Element) => (selector: MultiSelect_Selector<string>) => JSX.Element;
    static props: <DBType_1 extends DB_Object, Ks extends "_id" | "_v" | "_originDocId" | "__hardDelete" | "__created" | "__updated" | Exclude<keyof DBType_1, "_id" | "_v" | "_originDocId" | "__hardDelete" | "__created" | "__updated">>(props: MultiSelectDropDownProps<DBType_1, Ks>) => StaticProps_TS_MultiSelect_V2<string>;
    render(): JSX.Element;
    protected deriveStateFromProps(nextProps: Props<DBType>, state: Partial<{}> | undefined): {
        onSelected: (selected: string) => void | Promise<void>;
    };
}
export {};
