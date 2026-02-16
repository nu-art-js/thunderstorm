import { ComponentType } from 'react';
import { EditableItem, UIProps_EditableItem } from '@nu-art/editable-item';
import { ComponentSync } from '@nu-art/thunder-widgets';
export type Props_FormV3<T> = {
    className?: string;
    editable: EditableItem<T>;
    renderers: {
        [K in keyof T]?: {
            label: string;
            editor: ComponentType<UIProps_EditableItem<any, any, T[K]>>;
        };
    };
};
type State_FormV3<T> = {
    editable: EditableItem<T>;
};
export declare class Component_FormV3<T> extends ComponentSync<Props_FormV3<T>, State_FormV3<T>> {
    static defaultProps: {};
    constructor(p: Props_FormV3<T>);
    protected deriveStateFromProps(nextProps: Props_FormV3<T>, state: State_FormV3<T>): State_FormV3<T>;
    render(): import("react/jsx-runtime").JSX.Element;
    private renderField;
}
export {};
