import * as React from 'react';
import './Component_ShortUrlEditor.scss';
import {
	TS_EditableItemComponentV3
} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemComponent/TS_EditableItemComponent';
import {DBProto_ShortUrl, UI_ShortUrl} from '../../../../_entity/short-url/shared';
import {
	EditableRef,
	LL_H_C,
	ModuleFE_Thunderstorm,
	TS_BusyButton,
	TS_Card,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {InferProps, InferState} from '@nu-art/thunderstorm/frontend/utils/types';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';
import {TS_Icons} from '@nu-art/ts-styles';
import {
	TS_EditableItemStatus
} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemStatus/TS_EditableItemStatus';
import {ModuleFE_ShortUrl} from '../../../../_entity/short-url/frontend';

type Props = EditableRef<UI_ShortUrl> & { deleteCallback?: VoidFunction }
type State = EditableRef<UI_ShortUrl>


const StringEditableInput = TS_InputV2.editable({
	type: 'text',
	saveEvent: ['blur', 'accept']
});
const OptionalStringInput = TS_InputV2.editableOptional({
	type: 'text',
	saveEvent: ['blur', 'accept']
});

export class Component_ShortUrlEditor
	extends TS_EditableItemComponentV3<DBProto_ShortUrl, Props, State> {

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		state = super.deriveStateFromProps(nextProps, state);

		return state;
	}

	render() {
		const _id = this.state.editable.get('_id');
		return <TS_Card className={'short-url-editor'}>
			<LL_H_C className={'utils'}>
				<TS_EditableItemStatus editable={this.state.editable}/>
				<TS_Icons.x.component onClick={async () => {
					if (this.state.editable.get('_id'))
						await this.state.editable.delete();

					this.props.deleteCallback?.();
				}}/>
			</LL_H_C>
			<TS_PropRenderer.Vertical label={'Title'}>
				<StringEditableInput
					editable={this.state.editable}
					prop={'title'}
					onChange={value => {
						if (value.length)
							return this.state.editable.updateObj({title: value});

						return this.state.editable.updateObj({title: undefined});
					}}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Full Url'}>
				<StringEditableInput
					editable={this.state.editable}
					prop={'fullUrl'}
					onChange={value => {
						if (value.length)
							return this.state.editable.updateObj({fullUrl: value});

						return this.state.editable.updateObj({fullUrl: undefined});
					}}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Description'}>
				<OptionalStringInput
					editable={this.state.editable}
					prop={'description'}
					onChange={value => {
						if (value?.length)
							return this.state.editable.updateObj({description: value});

						return this.state.editable.updateObj({description: undefined});
					}}
				/>
			</TS_PropRenderer.Vertical>
			<LL_H_C className={'buttons-container'}>
				<TS_BusyButton
					disabled={!_id}
					onClick={async () => {
						const {shortUrl} = await ModuleFE_ShortUrl._v1.getShortUrl({_id: _id!}).executeSync();
						await ModuleFE_Thunderstorm.copyToClipboard(shortUrl);
					}}>
					Copy To Clipboard
				</TS_BusyButton>
				<TS_BusyButton onClick={async () => {
					await this.state.editable.save();
				}}>Save</TS_BusyButton>
			</LL_H_C>
		</TS_Card>;
	}
}
