import * as React from 'react';
import {ComponentSync, EditableItem, TS_Checkbox, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {AssetValueType} from '@nu-art/ts-common';


type InputProps<Value, Ex> = {
	disabled?: boolean,
	className?: string,
	onBlur?: (value: string) => void,
	onCheck?: (value: boolean) => void,
	readProcessor?: (value: Value) => Ex
	writeProcessor?: (value: Ex) => Value
};
export type EditableRef<Item> = { editable: EditableItem<Item> };

export type Props_ItemEditor<Item> = EditableRef<Item>;
export type State_ItemEditor<Item> = EditableRef<Item>;

export class Item_Editor<Item, Props extends {} = {}, State extends {} = {}>
	extends ComponentSync<Props & Props_ItemEditor<Item>, State & State_ItemEditor<Item>> {

	protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State & State_ItemEditor<Item>>): (State & State_ItemEditor<Item>) | undefined {
		const _state = (state || {}) as State & State_ItemEditor<Item>;
		_state.editable = nextProps.editable;
		return _state;
	}

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

	inputNumber = <K extends keyof Item, Ex extends number | undefined = number | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex>) => {
		const value = this.props.editable.item[prop] as number | undefined;
		return {
			vertical: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Vertical label={label} {...props}>
					<TS_Input type="number"
										value={String(readProcessor?.(value as unknown as Item[K]) || value)}
										onBlur={value => {
											onBlur ? onBlur(value) : this.props.editable.update(prop, writeProcessor?.(+value as Ex) || value as unknown as Item[K]);
										}}
										{...restProps}/>
				</TS_PropRenderer.Vertical>;
			},
			horizontal: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Horizontal label={label} {...props}>
					<TS_Input type="number"
										value={String(readProcessor?.(value as unknown as Item[K]) || value)}
										onBlur={value => {
											onBlur ? onBlur(value) : this.props.editable.update(prop, writeProcessor?.(+value as Ex) || value as unknown as Item[K]);
										}}
										{...restProps}/>
				</TS_PropRenderer.Horizontal>;
			}
		};
	};

	inputBoolean = <K extends keyof Item, Ex extends boolean | undefined = boolean | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex>) => {
		const value = this.props.editable.item[prop] as boolean | undefined;
		return {
			vertical: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onCheck, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Vertical label={label} {...props}>
					<TS_Checkbox
						checked={readProcessor?.(value as unknown as Item[K]) || value}
						onCheck={value => {
							onCheck ? onCheck(value) : this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as Item[K]);
							this.forceUpdate();
						}}
						{...restProps}
					/>
				</TS_PropRenderer.Vertical>;
			},
			horizontal: (label: string, props?: { className: string }) => {
				const {readProcessor, writeProcessor, onCheck, ...restProps} = inputProps || {};
				return <TS_PropRenderer.Horizontal label={label} {...props}>
					<TS_Checkbox
						checked={readProcessor?.(value as unknown as Item[K]) || value}
						onCheck={value => {
							onCheck ? onCheck(value) : this.props.editable.update(prop, writeProcessor?.(value as Ex) || value as unknown as Item[K]);
							this.forceUpdate();
						}}
						{...restProps}
					/>
				</TS_PropRenderer.Horizontal>;
			}
		};
	};
}

export type FormPropV1<T, K extends keyof T, EditorValueType, EditorProps, ValueType extends T[K] = T[K]> = {
	prop: K,
	label?: {
		orientation?: 'horizontal' | 'vertical' // default vertical
		label: string
	}
	readProcessor?: (value: EditorValueType) => ValueType
	writeProcessor?: (value: ValueType) => EditorValueType

}

// type K = DB_Object &{ pah:{zevel:string[],zevel2:string,ashpa:{zevel3:string}[]}}
// class KEditor extends Item_Editor<K> {
// 	func() {
// 		this.props.editable.editProp("pah",{}).editProp("ashpa", []).update(0,{zevel3:""})
// 	}
// }














