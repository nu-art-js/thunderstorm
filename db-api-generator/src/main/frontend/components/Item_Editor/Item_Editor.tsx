import * as React from 'react';
import {Component} from 'react';
import {EditableItem, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';


type AssetValueType<T, K extends keyof T, Ex> = T[K] extends Ex ? K : never

type InputProps<Value, Ex extends string | undefined = string | undefined> = {
	disabled?: boolean,
	className?: string,
	onBlur?: (value: string) => void,
	readProcessor?: (value: Value) => Ex
	writeProcessor?: (value: Ex) => Value
};

export class Item_Editor<Item, State extends {} = {}>
	extends Component<{ editable: EditableItem<Item> }, State> {
	input = <K extends keyof Item, Ex extends string | undefined = string | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex>) => {
		const value = this.props.editable.item[prop] as string | undefined;
		return {
			vertical: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Vertical label={label} {...props}>
					<TS_Input type="text"
										value={readProcessor?.(value as unknown as Item[K]) || value}
										onBlur={value => {
											onBlur ? onBlur(value) : this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as Item[K]);
										}}
										{...restProps}/>
				</TS_PropRenderer.Vertical>;
			},
			horizontal: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Horizontal label={label} {...props}>
					<TS_Input type="text"
										value={readProcessor?.(value as unknown as Item[K]) || value}
										onBlur={value => {
											onBlur ? onBlur(value) : this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as Item[K]);
										}}
										{...restProps}/>
				</TS_PropRenderer.Horizontal>;
			}
		};
	};
}

// type K = DB_Object &{ pah:{zevel:string[],zevel2:string,ashpa:{zevel3:string}[]}}
// class KEditor extends Item_Editor<K> {
// 	func() {
// 		this.props.editable.editProp("pah",{}).editProp("ashpa", []).update(0,{zevel3:""})
// 	}
// }














