import {ReactNode} from 'react';
import {EditableContentType, EditableItem, TS_EditableContent} from '@nu-art/thunderstorm-frontend';
import {__stringify, tsValidateResult, ValidatorTypeResolver} from '@nu-art/ts-common';
import {InferProps, InferState, TS_TextArea} from '@nu-art/thunder-widgets';
import './Editor_JsonToObject.scss';

type Props<T> = {
	validator: ValidatorTypeResolver<EditableContentType<T>>;
	renderer: (item: EditableItem<EditableContentType<T>>) => ReactNode;
	isFreeTextMode: boolean
}

type State = {
	isFreeTextMode: boolean
	value: string
	isValid: boolean
}

export class Editor_JsonToObject<T>
	extends TS_EditableContent<T, Props<T>, State> {

	protected deriveStateFromProps(nextProps: InferProps<this>, _state: InferState<this>): InferState<this> {
		const state = super.deriveStateFromProps(nextProps, _state) as InferState<this>;
		state.isFreeTextMode = nextProps.isFreeTextMode;

		const value = nextProps.editable.item ? __stringify(nextProps.editable.item, true) : '';
		state.value = value;
		state.isValid = this.validateItem(value).isValid;

		return state;
	}

	render() {
		const {isFreeTextMode, value, editable, isValid} = this.state;
		return <>
			{!isFreeTextMode && this.props.renderer(editable)}
			{isFreeTextMode && <TS_TextArea
				className={'ts-json-to-object'}
				resizeWithText
				data-valid={isValid}
				type="text"
				value={value}
				onChange={async (value) => {
					const {isValid} = this.validateItem(value);
					return this.setState({isValid});
				}}
				onBlur={async (value) => {
					const {isValid, item} = this.validateItem(value);
					if (!isValid)
						return this.setState({isValid, value});

					await editable.updateObj(item);
				}}
			/>
			}
		</>;
	}

	private validateItem(value: string) {
		let isValid: boolean;
		let item = {} as EditableContentType<T>;
		try {
			item = JSON.parse(value) as EditableContentType<T>;
			isValid = tsValidateResult(item, this.props.validator) === undefined;
		} catch (e: any) {
			isValid = false;
		}
		return {isValid, item};
	}
}
