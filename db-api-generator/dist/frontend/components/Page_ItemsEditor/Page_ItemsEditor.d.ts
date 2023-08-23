import * as React from 'react';
import { TS_Route } from '@nu-art/thunderstorm/frontend';
import { DB_Object, Filter } from '@nu-art/ts-common';
import { Props_SmartComponent, State_SmartComponent } from '../SmartComponent';
import { EditableDBItem } from '../../utils/EditableDBItem';
import { Props_SmartPage, SmartPage } from '../SmartPage';
import './Page_ItemsEditor.scss';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
export type State_ItemsEditor<DBItem extends DB_Object> = State_SmartComponent & {
    editable: EditableDBItem<DBItem>;
};
export type Props_ItemsEditor<DBItem extends DB_Object> = Props_SmartPage<State_ItemsEditor<DBItem>> & {
    ListRenderer?: React.ComponentType<Props_ListRenderer<DBItem>>;
    EditorRenderer: React.ComponentType<{
        editable: EditableDBItem<DBItem>;
    }>;
    module: ModuleFE_BaseApi<DBItem>;
    route: TS_Route<{
        _id: string;
    }>;
    sort: (item: DBItem) => string | number;
    filter: Filter<DBItem>;
    itemRenderer: (item: DBItem) => JSX.Element;
};
export declare class Page_ItemsEditor<DBItem extends DB_Object> extends SmartPage<Props_ItemsEditor<DBItem>, State_ItemsEditor<DBItem>> {
    constructor(p: Props_ItemsEditor<DBItem>);
    protected deriveStateFromProps(nextProps: Props_SmartComponent, state: State_ItemsEditor<DBItem>): Promise<State_ItemsEditor<DBItem>>;
    private createEditableItem;
    render(): JSX.Element;
    private onSelected;
}
export type Props_ListRenderer<DBItem extends DB_Object> = {
    module: ModuleFE_BaseApi<DBItem>;
    selected?: Partial<DBItem>;
    filter: Filter<DBItem>;
    onSelected: (item: DBItem) => void;
    sort: (item: DBItem) => string | number;
    itemRenderer: (item: DBItem) => JSX.Element;
};
export declare class DefaultListRenderer<DBItem extends DB_Object> extends React.Component<Props_ListRenderer<DBItem>, {
    filterText: string;
}> {
    state: {
        filterText: string;
    };
    render(): JSX.Element;
}
