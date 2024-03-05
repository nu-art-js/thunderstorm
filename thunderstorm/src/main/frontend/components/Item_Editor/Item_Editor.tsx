import * as React from 'react';
import {ReactNode} from 'react';
import {asArray, AssetValueType, DB_Object, dbObjectToId, merge} from '@nu-art/ts-common';
import {EditableDBItem} from '../../utils/EditableDBItem';
import {EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {Props_PropRenderer, Props_PropRendererHorizontal, TS_PropRenderer} from '../TS_PropRenderer';
import {TS_Input} from '../TS_Input';
import {TS_Checkbox} from '../TS_Checkbox';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ApiCallerEventType} from '../../core/db-api-gen/types';


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

	protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State & State_ItemEditor<Item>>): (State & State_ItemEditor<Item>) {
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
											if (onBlur)
												return onBlur(value);

											// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
											const _value: {} = {[prop]: writeProcessor?.(value as Ex) || value as unknown as Item[K]};
											return this.props.editable.updateObj(_value);
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
											if (onBlur)
												return onBlur(value);

											// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
											const _value: {} = {[prop]: writeProcessor?.(value as Ex) || value as unknown as Item[K]};
											return this.props.editable.updateObj(_value);
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
											if (onBlur)
												return onBlur(value);

											// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
											const _value: {} = {[prop]: writeProcessor?.(+value as Ex) || value as unknown as Item[K]};
											return this.props.editable.updateObj(_value);
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
											if (onBlur)
												return onBlur(value);

											// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
											const _value: {} = {[prop]: writeProcessor?.(+value as Ex) || value as unknown as Item[K]};
											return this.props.editable.updateObj(_value);
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
						onCheck={async value => {
							if (onCheck)
								return onCheck(value);

							// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
							const _value: {} = {[prop]: writeProcessor?.(value as Ex) || value as unknown as Item[K]};
							await this.props.editable.updateObj(_value);
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
						onCheck={async value => {
							if (onCheck)
								return onCheck(value);

							// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
							const _value: {} = {[prop]: writeProcessor?.(value as Ex) || value as unknown as Item[K]};
							await this.props.editable.updateObj(_value);
							this.forceUpdate();
						}}
						{...restProps}
					/>
				</TS_PropRenderer.Horizontal>;
			}
		};
	};

	edit = <K extends keyof Item>(key: K) => {
		const editable = this.state.editable;
		let orientation: 'vertical' | 'horizontal' = 'vertical';
		let propRenderer_Props: Props_PropRenderer | undefined;
		const _builder = {
			label: (label: string) => {
				merge(propRenderer_Props, {label});
				return _builder;
			},
			vertical: (props: Props_PropRenderer) => {
				orientation = 'vertical';
				propRenderer_Props = props;
				return _builder;
			},
			horizontal: (props: Props_PropRendererHorizontal) => {
				orientation = 'horizontal';
				return _builder;
			},
			render: (renderer: (prop: K, editable: EditableItem<Item>) => ReactNode): ReactNode => {
				const PropRenderer = orientation === 'horizontal' ? TS_PropRenderer.Horizontal : TS_PropRenderer.Vertical;
				const editor = renderer(key, editable);
				if (propRenderer_Props)
					return <PropRenderer {...propRenderer_Props}>{editor}</PropRenderer>;

				return editor;
			}
		};

		return _builder;
	};

	input_v2 = <K extends keyof Item, Ex extends string | undefined = string | undefined>(prop: AssetValueType<Item, K, Ex>, inputProps?: InputProps<Item[K], Ex>) => {
		const value = this.props.editable.item[prop] as string | undefined;
		const {readProcessor, writeProcessor, onBlur, ...restProps} = inputProps || {};
		return <TS_Input
			type="text"
			value={readProcessor?.(value as unknown as Item[K]) || value}
			onBlur={value => {
				if (onBlur)
					return onBlur(value);

				// type is {[keyof Item]: ResolvableContent<Item[K] | undefined> }
				const _value: {} = {[prop]: writeProcessor?.(value as Ex) || value as unknown as Item[K]};
				return this.props.editable.updateObj(_value);
			}}
			{...restProps}/>;
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
		const items = asArray(params[1]);
		if (!items.map(dbObjectToId).includes(this.state.editable.item._id!))
			return;

		return this.reDeriveState();
	};

	protected deriveStateFromProps(nextProps: Props & Props_ItemEditor<Item>, state?: Partial<State_ItemEditor<Item>>): (State_ItemEditor<Item>) {
		const _state = (state || {}) as State_ItemEditor<Item>;
		const item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
		_state.editable = new EditableDBItem(item!, nextProps.module, async (item) => {
			this.setState(state => ({editable: state.editable}));
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
