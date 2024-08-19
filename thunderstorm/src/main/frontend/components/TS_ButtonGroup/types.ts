import {ResolvableContent} from '@nu-art/ts-common';
import * as React from 'react';

export type ButtonGroupItem_Controlled<K extends string> = {
	key: K;
	label: string;
	disabled?: boolean;
	className?: string;
};

export type ButtonGroupItem_NonControlled<K extends string> = ButtonGroupItem_Controlled<K> & {
	//If the group is controlled, then a general clickCallback is passed in the props, if not controlled each button
	//must supply a click callback
	onClick: (e: React.MouseEvent<HTMLDivElement>) => (Promise<void> | void);
};

export type ButtonGroupItem<K extends string, Controlled extends boolean> = Controlled extends true
	? ButtonGroupItem_Controlled<K> : ButtonGroupItem_NonControlled<K>;

export type ButtonGroupItems<ButtonKeys extends string, Controlled extends boolean> = {
	[K in ButtonKeys]: ButtonGroupItem<K, Controlled>;
}[ButtonKeys][];

export type ButtonGroup_Props_Controlled<ButtonKey extends string> = {
	controlled: true;
	buttons: ButtonGroupItems<ButtonKey, true>;
	clickCallback: (key: ButtonKey) => Promise<void> | void;
	selectedKey?: ButtonKey;
};

type ButtonGroup_Props_NonControlled<ButtonKey extends string> = {
	controlled: false | undefined;
	buttons: ButtonGroupItems<ButtonKey, false>;
	defaultButtonKey?: ButtonKey;
};

export type ButtonGroup_Props<ButtonKey extends string> = {
	direction: 'horizontal' | 'vertical';
	//optionals
	className?: string;
	loaderRenderer?: ResolvableContent<React.ReactNode>
} & (ButtonGroup_Props_NonControlled<ButtonKey> | ButtonGroup_Props_Controlled<ButtonKey>);

export type ButtonGroup_State<ButtonKey extends string> = {
	selectedKey?: ButtonKey; // the currently selected item in group
	actionInProgress?: boolean;
	buttons: ButtonGroupItems<ButtonKey, boolean>;
}