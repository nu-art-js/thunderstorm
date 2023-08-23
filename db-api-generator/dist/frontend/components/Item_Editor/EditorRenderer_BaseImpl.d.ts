import { Item_Editor, Props_ItemEditor, State_ItemEditor } from './Item_Editor';
export type Props_EditorRenderer<Item> = Props_ItemEditor<Item> & {
    creationMode?: boolean;
    isInEditMode?: boolean;
};
export type State_EditorRenderer<Item> = State_ItemEditor<Item> & {
    isInEditMode?: boolean;
    creationMode?: boolean;
};
export declare function throwValidationException(err: any): void;
export declare class EditorRenderer_BaseImpl<Item, Props extends Props_EditorRenderer<Item> = Props_EditorRenderer<Item>, State extends State_EditorRenderer<Item> = State_EditorRenderer<Item>> extends Item_Editor<Item, Props> {
    protected deriveStateFromProps(nextProps: Props & Props_EditorRenderer<Item>, state: State & State_EditorRenderer<Item>): State_EditorRenderer<Item> | undefined;
    creationMode(): boolean;
    editMode(): boolean;
}
