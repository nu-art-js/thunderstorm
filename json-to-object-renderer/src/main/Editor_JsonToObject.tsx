import {EditableItem, TS_EditableItemComponent} from '@nu-art/thunderstorm/frontend';
import {__stringify, tsValidateResult, ValidatorTypeResolver} from '@nu-art/ts-common';
import React, {ReactNode} from 'react';
import {TS_TextAreaV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_TextArea';
import {InferProps, InferState} from '@nu-art/thunderstorm/frontend/utils/types';
import './Editor_JsonToObject.scss';

type Props<T> = {
	validator: ValidatorTypeResolver<T>;
	renderer: (item: EditableItem<T>) => ReactNode;
	freeText: boolean
}

type State<T> = {
	freeText: boolean
	value: string
	isValid: boolean
}

/*
{
	"a":"asdasd",
	"b":"ksfdjfsdk",
	"c":"kl;jkljl"
}
 */
export class Editor_JsonToObject<T>
	extends TS_EditableItemComponent<T, Props<T>, State<T>> {

	protected deriveStateFromProps(nextProps: InferProps<this>, _state: InferState<this>): InferState<this> {
		const state = super.deriveStateFromProps(nextProps, _state) as InferState<this>;
		state.freeText = nextProps.freeText;
		state.value = nextProps.editable.item ? __stringify(nextProps.editable.item, true) : '';
		state.isValid = tsValidateResult(JSON.parse(state.value) as T, this.props.validator) === undefined;

		return state;
	}

	render() {
		return <>
			{!this.state.freeText && this.props.renderer(this.state.editable)}
			{this.state.freeText && <TS_TextAreaV2
				className={'ts-json-to-object'}
				resizeWithText={true}
				data-valid={this.state.isValid}
				type="text"
				value={this.state.value}
				onChange={async (value) => {
					const {isValid} = this.validateItem(value);
					return this.setState({isValid});
				}}
				onAccept={async (value) => {
					const {isValid, item} = this.validateItem(value);
					if (!isValid)
						return this.setState({isValid, value});

					await this.state.editable.updateObj(item);
				}}/>
			}
		</>;
	}


	private validateItem(value: string) {
		let isValid: boolean;
		let item = {} as T;
		try {
			item = JSON.parse(value) as T;
			isValid = tsValidateResult(item, this.props.validator) === undefined;
		} catch (e: any) {
			isValid = false;
		}
		return {isValid, item};
	}
}