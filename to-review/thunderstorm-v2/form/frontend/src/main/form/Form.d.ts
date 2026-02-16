import { Form, FormRenderer } from './types.js';
import * as React from 'react';
import { TS_Object, TypeValidator } from '@nu-art/ts-common';
export type FormProps<T extends TS_Object = object> = {
    form: Form<T>;
    renderer: FormRenderer<T>;
    value: Partial<T>;
    validator?: TypeValidator<T>;
    className?: string;
    onAccept: (value: T) => void;
};
type Props<T extends TS_Object = object> = FormProps<T> & {
    showErrors: boolean;
};
type State<T extends TS_Object = object> = {
    value: Partial<T>;
};
export declare class Component_Form<T extends TS_Object = TS_Object> extends React.Component<Props<T>, State<T>> {
    constructor(p: Props<T>);
    render(): import("react/jsx-runtime").JSX.Element;
    private renderField;
    private onValueChanged;
}
export {};
