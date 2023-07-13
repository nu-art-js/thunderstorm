import * as React from 'react';
import './PathwayManager_Editors.scss';
import {LL_H_C, LL_V_L, TS_Button} from '@nu-art/thunderstorm/frontend';
import {Item_Editor, Props_ItemEditor, State_ItemEditor} from '@nu-art/db-api-generator/frontend';
import {ServiceAccountApi} from '../../shared/proxy-v2/types';

export type Props_Extra = Props_ItemEditor<ServiceAccountApi> & {
	updateEditMode?: () => void
	onDelete: () => void
}
export type State = State_ItemEditor<ServiceAccountApi>

export class ServiceAccountExtra_EditorRenderer
	extends Item_Editor<ServiceAccountApi, Props_Extra, State> {

	private savePathway = async () => {
		await this.props.editable.save();
	};


	private renderSaveButtons = () => <LL_H_C className={'buttons-container'}>
		<TS_Button onClick={this.props.updateEditMode}>CANCEL</TS_Button>
		<TS_Button onClick={this.savePathway}>SAVE</TS_Button>
	</LL_H_C>;

	private renderEditorBody = () => {
		return <LL_V_L className={'form-wrapper match_height'}>
			<div className={'title'}>{'Edit Pathway'}</div>
			{this.input('key').vertical('Key')}
			{this.input('value').vertical('Value')}
		</LL_V_L>;
	};

	render() {
		return <div className={'pathway-manager-editor match_parent'}>
			{this.renderSaveButtons()}
			{this.renderEditorBody()}
		</div>;
	}
}