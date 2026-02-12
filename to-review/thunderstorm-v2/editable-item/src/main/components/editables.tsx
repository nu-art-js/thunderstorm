import * as React from 'react';
import {
	BaseAppLevelProps_TS_GenericDropDownV3,
	BaseAppLevelProps_TS_InputV2,
	BaseAppLevelProps_TS_TextAreaV2,
	BasePartialProps_DropDown,
	ComponentProps_Error,
	GenericDropDown_DBPointer_Item,
	GenericDropDownV3,
	MandatoryProps_TS_DropDown,
	Props_Checkbox,
	resolveEditableError,
	ResolveEditableErrorParams,
	TemplatingProps_TS_Checkbox,
	TemplatingProps_TS_GenericDropDown,
	TemplatingProps_TS_GenericDropDown_DBPointer,
	TemplatingProps_TS_InputV2,
	TemplatingProps_TS_TextAreaV2,
	TS_Checkbox,
	TS_DropDown,
	TS_InputV2,
	TS_TextAreaV2
} from '@nu-art/web-client';
import {UIProps_EditableItem} from '../core/EditableItem.js';
import {DBPointer, DBProto, ResolvableContent, resolveContent, SubsetKeys, TS_Object} from '@nu-art/ts-common';

type Props_CanUnselect_NonMandatory<ItemType> = { canUnselect: true; onSelected?: (selected?: ItemType) => void };
type Props_CanNotUnselect_NonMandatory<ItemType> = { canUnselect?: false; onSelected?: (selected: ItemType) => void };


type EditableDropDownProps<ItemType, EditableType extends {} = any, ValueType extends EditableType[keyof EditableType] = EditableType[keyof EditableType]> =
	BasePartialProps_DropDown<ItemType>
	& UIProps_EditableItem<EditableType, keyof EditableType, ValueType>
	& ComponentProps_Error
	& (Props_CanUnselect_NonMandatory<ItemType> | Props_CanNotUnselect_NonMandatory<ItemType>)


type EditableItemProps_GenericDropDownV3<T> =
	BaseAppLevelProps_TS_GenericDropDownV3<T>
	& UIProps_EditableItem<any, any, string>
	& {
	onSelected?: (selected: T | undefined, superOnSelected: (selected?: T) => Promise<void>) => void
	canUnselect?: boolean
}
	& ComponentProps_Error


type EditableItemProps_GenericDropDownV3_DBPointer<T> =
	BaseAppLevelProps_TS_GenericDropDownV3<T>
	& UIProps_EditableItem<any, any, DBPointer>
	& {
	onSelected?: (selected: T | undefined, superOnSelected: (selected?: T) => Promise<void>) => void
	canUnselect?: boolean
}
	& ComponentProps_Error


export type EditableItemProps_TS_Checkbox<T extends TS_Object & { [k in K]?: any }, K extends SubsetKeys<keyof T, T, boolean | undefined>> =
	Omit<Props_Checkbox, 'checked'>
	& UIProps_EditableItem<T, K, boolean | undefined>
	& {
	checked?: boolean,
	onCheck?: (value: boolean, e: React.MouseEvent<HTMLDivElement>) => void,
}

export type EditableItemProps_TS_InputV2<ValueType, K extends keyof T, T extends TS_Object & { [k in K]: ValueType } | ValueType[]> =
	Omit<BaseAppLevelProps_TS_InputV2, 'value'> & { value?: ValueType }
	& UIProps_EditableItem<T, K, ValueType>
	& { onChange?: (value: ValueType) => Promise<any> | any, }

export type EditableItemProps_TS_TextAreaV2 = BaseAppLevelProps_TS_TextAreaV2
	& UIProps_EditableItem<any, any, string>
	& { onChange?: (value: string) => void, componentRef?: React.RefObject<TS_TextAreaV2>; }

const editableTimeOptional = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]?: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableTime(templateProps)(props);
	};
};

const editableTime = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableTime(templateProps)(props);
	};
};

const _editableTime = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<number | string, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
		let onChange;
		let onBlur;
		let onAccept;

		const saveEventHandler = (value: string | number) => {
			return _onChange ? _onChange(value) : editable.updateObj({[prop]: value} as T);
		};

		if (_saveEvents!.includes('change'))
			onChange = saveEventHandler;

		if (_saveEvents!.includes('blur'))
			onBlur = saveEventHandler;

		if (_saveEvents!.includes('accept'))
			onAccept = saveEventHandler;

		const value: string = props.editable.get(props.prop);
		const newVar = {...rest, prop, hasError: (key: keyof T) => !!props.editable.hasError(props.prop)};

		return <TS_InputV2
			error={resolveEditableError(newVar)}
			{...restTemplatingProps} {...rest}
			type={type}
			onChange={onChange}
			showErrorTooltip={showErrorTooltip}
			onBlur={onBlur}
			onAccept={onAccept}
			value={String(props.value ?? value)}/>;
	};
};

const editableNumberOptional = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]?: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		// @ts-ignore
		return _editableNumber(templateProps)(props);
	};
};

const editableNumber = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableNumber(templateProps)(props);
	};
};
const _editableNumber = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<number, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
		let onChange;
		let onBlur;
		let onAccept;

		const saveEventHandler = (value: string) => {
			return _onChange ? _onChange(+value) : editable.updateObj({[prop]: +value} as T);
		};

		if (_saveEvents!.includes('change'))
			onChange = saveEventHandler;

		if (_saveEvents!.includes('blur'))
			onBlur = saveEventHandler;

		if (_saveEvents!.includes('accept'))
			onAccept = saveEventHandler;

		const value: string = props.editable.get(props.prop);
		const newVar = {...rest, prop, hasError: (key: keyof T) => !!props.editable.hasError(props.prop)};

		return <TS_InputV2
			error={resolveEditableError(newVar)}
			{...restTemplatingProps} {...rest}
			type={type}
			showErrorTooltip={showErrorTooltip}
			onChange={onChange}
			onBlur={onBlur}
			onAccept={onAccept}
			value={String(props.value ?? value)}/>;
	};
};

const editableOptional = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & ({ [k in K]?: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
		return _editable(templateProps)(props);
	};
};

const editableArray = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends keyof T, T extends string[]>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
		// @ts-ignore
		return _editable(templateProps)(props);
	};
};

const editable = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & ({ [k in K]: string })>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
		// @ts-ignore
		return _editable(templateProps)(props);
	};
};

const _editable = (templateProps: TemplatingProps_TS_InputV2) => {
	return <K extends string, T extends TS_Object & ({ [k in K]?: string } | { [k in K]: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
		let onChange;
		let onBlur;
		let onAccept;

		const saveEventHandler = (value: string) => {
			return _onChange ? _onChange(value) : editable.updateObj({[prop]: value} as T);
		};

		if (_saveEvents!.includes('change'))
			onChange = saveEventHandler;

		if (_saveEvents!.includes('blur'))
			onBlur = saveEventHandler;

		if (_saveEvents!.includes('accept'))
			onAccept = saveEventHandler;

		const newVar = {...rest, prop, hasError: (key: keyof T) => !!props.editable.hasError(props.prop)};

		const value: string = editable.get(prop);
		return <TS_InputV2
			error={resolveEditableError(newVar)}
			{...restTemplatingProps} {...rest}
			type={type}
			onChange={onChange}
			onBlur={onBlur}
			onAccept={onAccept}
			showErrorTooltip={showErrorTooltip}
			value={props.value ?? value}/>;
	};
};

export const EDITABLE = {
	DropDown: <T, EditableType extends {} = any, ValueType extends EditableType[keyof EditableType] = EditableType[keyof EditableType]>(mandatoryProps: ResolvableContent<MandatoryProps_TS_DropDown<T>>) => {
		return (props: EditableDropDownProps<T, EditableType, ValueType>) => {

			const newVar = {...props, hasError: (p: keyof EditableType) => !!props.editable.hasError(p)};
			return <TS_DropDown<T>
				{...resolveContent(mandatoryProps)} {...props}
				error={resolveEditableError(newVar)}
				onSelected={(item?: T) => props.onSelected ? props.onSelected(item!) : props.editable.updateObj({[props.prop]: item} as EditableType)}
				selected={props.editable.item[props.prop] as T | undefined}/>;
		};
	},
	GenericDropDownV3: <Proto_ extends DBProto<any>>(mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown<Proto_>>) => {
		return (props: EditableItemProps_GenericDropDownV3<Proto_['dbType']>) => {
			const {editable, prop, ...restProps} = props;

			const onSelected = async (item: Proto_['dbType']) => {
				await editable.updateObj({[prop]: item?._id});
			};
			const newVar = {...props, hasError: (p: keyof Proto_['dbType']) => !!props.editable.hasError(p)};

			return <GenericDropDownV3<Proto_>
				error={resolveEditableError(newVar)}
				{...resolveContent(mandatoryProps)}
				{...restProps}
				onSelected={async item => {
					if (props.onSelected)
						return props.onSelected(item, onSelected);

					return onSelected(item);
				}}
				selected={editable.item[prop]}/>;
		};
	},
	GenericDropDownV3_Pointer: <Proto_ extends DBProto<any>>(mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown_DBPointer<Proto_>>) => {
		return (props: EditableItemProps_GenericDropDownV3_DBPointer<GenericDropDown_DBPointer_Item<Proto_>>) => {
			const _mandatoryProps = resolveContent(mandatoryProps);
			const {editable, prop, ...restProps} = props;

			const onSelected = async (item: Proto_['dbType']) => {
				await editable.updateObj({[prop]: item._id});
			};

			const newVar = {...props, hasError: (p: keyof Proto_['dbType']) => !!props.editable.hasError(p)};
			return <GenericDropDownV3
				error={resolveEditableError(newVar)}
				{..._mandatoryProps}
				{...restProps}
				onSelected={async item => {
					if (props.onSelected)
						return props.onSelected(item, onSelected);

					return onSelected(item);
				}}
				selected={editable.item[prop]}
				// @ts-ignore
				module={undefined}
			/>;
		};
	},
	CheckBox: (templateProps: TemplatingProps_TS_Checkbox) => {
		return <T extends TS_Object & { [k in K]?: any }, K extends SubsetKeys<keyof T, T, boolean | undefined>>(props: EditableItemProps_TS_Checkbox<T, K>) => {
			const checked = props.editable.get(props.prop);
			return <TS_Checkbox {...templateProps} {...props} checked={checked} onCheck={checked => props.editable.updateObj({[props.prop]: checked} as T)}/>;
		};
	},
	Input: {
		editableTimeOptional,
		editableTime,
		_editableTime,
		editableNumberOptional,
		editableNumber,
		_editableNumber,
		editableOptional,
		editableArray,
		editable,
	},
	TextArea: (templateProps: TemplatingProps_TS_TextAreaV2) => {
		return (props: EditableItemProps_TS_TextAreaV2) => {
			const {editable, prop, saveEvent, componentRef, ...rest} = props;
			const _saveEvents = [...saveEvent || [], ...templateProps.saveEvent || []];
			let onChange;
			let onBlur;
			let onAccept;

			const saveEventHandler = (value: string) => {
				return props.onChange ? props.onChange(value) : editable.updateObj({[prop]: value});
			};

			if (_saveEvents!.includes('change'))
				onChange = saveEventHandler;

			if (_saveEvents!.includes('blur'))
				onBlur = saveEventHandler;

			if (_saveEvents!.includes('accept'))
				onAccept = saveEventHandler;

			const newVar: ResolveEditableErrorParams<string> = {...rest, prop, hasError: (key: keyof string) => !!props.editable.hasError(props.prop)};

			return <TS_TextAreaV2
				{...templateProps}
				{...rest}
				error={resolveEditableError(newVar)}
				ref={componentRef}
				onChange={onChange}
				onBlur={onBlur}
				onAccept={onAccept}
				value={props.editable.item[props.prop]}/>;
		};

	}
};


