import * as React from 'react';
import {ReactNode} from 'react';
import {ComponentSync, EditableItem, TS_Checkbox, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {AssetValueType, DB_Object, dbObjectToId} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../../modules/ModuleFE_BaseApi';
import {EditableDBItem} from '../../utils/EditableDBItem';
import {ApiCallerEventType} from '../../modules/types';


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

export type Props_ItemEditorController<T extends DB_Object> = {
	item: Partial<T> | string,
	module: ModuleFE_BaseApi<T, any>,
	onCompleted?: (item: T) => any | Promise<any>,
	onError?: (err: Error) => any | Promise<any>
	autoSave?: boolean
	editor: (editable: EditableItem<T>) => ReactNode
};

export class Item_EditorController<Item extends DB_Object, Props extends Props_ItemEditorController<Item> = Props_ItemEditorController<Item>>
	extends ComponentSync<Props, State_ItemEditor<Item>> {
	constructor(p: Props) {
		super(p);

		const method = p.module.defaultDispatcher.method;
		// @ts-ignore
		this[method] = this.__onItemUpdated;
	}

	private __onItemUpdated = (...params: ApiCallerEventType<Item>): void => {
		const items = Array.isArray(params[1]) ? params[1] : [params[1]];
		if (!items.map(dbObjectToId).includes(this.state.editable.item._id!))
			return;

		return this.reDeriveState();
	};

	protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State_ItemEditor<Item>>): (State_ItemEditor<Item>) | undefined {
		const _state = (state || {}) as State_ItemEditor<Item>;
		const item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
		_state.editable = new EditableDBItem(item!, nextProps.module, async (item) => {
			this.setState(state => ({editable: state.editable.clone(item)}));
			await nextProps.onCompleted?.(item);
		}, nextProps.onError).setAutoSave(nextProps.autoSave || false);
		return _state;
	}

	render() {
		return this.props.editor(this.state.editable);
	}
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














