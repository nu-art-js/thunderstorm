import { ComponentSync } from '@nu-art/thunder-widgets';
export type Props_TSForm<T> = {
    value: T;
};
export type State_TSForm<T> = {};
export declare class TS_Form<T extends object> extends ComponentSync<Props_TSForm<T>, State_TSForm<T>> {
    protected deriveStateFromProps(nextProps: Props_TSForm<T>): State_TSForm<T>;
    render(): import("react/jsx-runtime").JSX.Element;
}
