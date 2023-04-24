import * as React from 'react';
import {Component} from 'react';
import {TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {DB_Object} from '@nu-art/ts-common';
import {EditableDBItem} from '../../utils/EditableDBItem';


type AssetValueType<T, K extends keyof T, Ex> = T[K] extends Ex ? K : never

type InputProps<Value, Ex extends string | undefined = string | undefined> = {
	disabled?: boolean,
	className?: string,
	readProcessor?: (value: Value) => Ex
	writeProcessor?: (value: Ex) => Value
};

export class DBItem_Editor<DBItem extends DB_Object, State extends {} = {}>
	extends Component<{ editable: EditableDBItem<DBItem> }, State> {
	input = <K extends keyof DBItem, Ex extends string | undefined = string | undefined>(prop: AssetValueType<DBItem, K, Ex>, inputProps?: InputProps<DBItem[K], Ex>) => {
		const value = this.props.editable.item[prop] as string | undefined;
		return {
			vertical: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Vertical label={label} {...props}>
					<TS_Input {...restProps}
										type="text"
										value={readProcessor?.(value as unknown as DBItem[K]) || value}
										onBlur={value => this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as DBItem[K])}/>
				</TS_PropRenderer.Vertical>;
			},
			horizontal: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Horizontal label={label} {...props}>
					<TS_Input {...restProps}
										type="text"
										value={readProcessor?.(value as unknown as DBItem[K]) || value}
										onBlur={value => this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as DBItem[K])}/>
				</TS_PropRenderer.Horizontal>;
			}
		};
	};
}

// type K = DB_Object &{ pah:{zevel:string[],zevel2:string,ashpa:{zevel3:string}[]}}
// class KEditor extends DBItem_Editor<K> {
// 	func() {
// 		this.props.editable.editProp("pah",{}).editProp("ashpa", []).update(0,{zevel3:""})
// 	}
// }














