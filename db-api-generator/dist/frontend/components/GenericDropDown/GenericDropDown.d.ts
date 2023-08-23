import { Adapter, ComponentSync, TS_DropDown } from '@nu-art/thunderstorm/frontend';
import { DB_Object, Default_UniqueKey, Filter, PreDB } from '@nu-art/ts-common';
import * as React from 'react';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
type OptionalCanUnselect<T> = ({
    canUnselect: true;
    onSelected: (selected?: T) => void;
} | {
    canUnselect?: false;
    onSelected: (selected: T) => void;
});
type OptionalProps_GenericDropDown<T> = {
    placeholder?: string;
    mapper?: (item: T) => string[];
    renderer?: (item: T) => React.ReactElement;
    queryFilter?: (item: T) => boolean;
    ifNoneShowAll?: boolean;
    sortBy?: ((keyof T) | ((item: T) => string | number))[];
    className?: string;
    caret?: {
        open: React.ReactNode;
        close: React.ReactNode;
    };
    renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
    limitItems?: number;
    noOptionsRenderer?: React.ReactNode | (() => React.ReactNode);
    disabled?: boolean;
};
export type PartialProps_GenericDropDown<T> = OptionalProps_GenericDropDown<T> & {
    onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;
    boundingParentSelector?: string;
    inputValue?: string;
    selected?: T | string | (() => T | undefined);
    limitItems?: number;
    itemResolver?: () => T[];
} & OptionalCanUnselect<T>;
export type MandatoryProps_GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> = OptionalProps_GenericDropDown<T> & {
    placeholder: string;
    module: ModuleFE_BaseApi<T, Ks>;
    modules: ModuleFE_BaseApi<DB_Object, any>[];
    mapper: (item: T) => string[];
    renderer: (item: T) => React.ReactElement;
};
type GenericDropDownProps<T, Ks> = {
    placeholder?: string;
    mapper: (item: T) => string[];
    renderer: (item: T) => React.ReactElement;
    queryFilter?: (item: T) => boolean;
    ifNoneShowAll?: boolean;
    sortBy?: ((keyof T) | ((item: T) => string | number))[];
    className?: string;
    caret?: {
        open: React.ReactNode;
        close: React.ReactNode;
    };
    renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
    selected?: T | string | (() => T | undefined);
    inputValue?: string;
    onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;
    modules: ModuleFE_BaseApi<DB_Object, any>[];
    boundingParentSelector?: string;
    limitItems?: number;
    disabled?: boolean;
    itemResolver?: () => T[];
} & OptionalCanUnselect<T>;
export type Props_GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> = {
    module: ModuleFE_BaseApi<T, Ks>;
} & GenericDropDownProps<T, Ks>;
type State<T extends DB_Object> = {
    items: T[];
    selected?: T;
    filter: Filter<T>;
    adapter: Adapter<T>;
};
export declare class GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> extends ComponentSync<Props_GenericDropDown<T, Ks>, State<T>> {
    protected deriveStateFromProps(nextProps: Props_GenericDropDown<T, Ks>): State<T>;
    private getSelected;
    render(): JSX.Element;
}
export {};
