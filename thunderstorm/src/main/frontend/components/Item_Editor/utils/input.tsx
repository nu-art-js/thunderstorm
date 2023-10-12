import {TS_Input} from '../../TS_Input';
import * as React from 'react';
import {EditableItem} from '../../../utils/EditableItem';


type InputProps<Value, Ex> = {
	disabled?: boolean,
	className?: string,
	onBlur?: (value: string) => void,
	onCheck?: (value: boolean) => void,
	readProcessor?: (value: Value) => Ex
	writeProcessor?: (value: Ex) => Value
};

export const Edit_Input = <Item extends {}, K extends keyof Item, Ex extends string | undefined = string | undefined>(prop: K, editable: EditableItem<Item>, inputProps?: InputProps<Item[K], Ex>) => {
	const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};

	const value = editable.item[prop] as string | undefined;
	return <TS_Input
		type="text"
		value={readProcessor?.(value as unknown as Item[K]) || value}
		onBlur={value => {
			onBlur ? onBlur(value) : editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as Item[K]);
		}}
		{...restProps}/>;
};
