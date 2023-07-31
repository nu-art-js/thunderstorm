import * as React from 'react';
import './ProxyServiceAccount_EditorRenderer.scss';
import {EditableItem, LL_H_C, LL_V_L, TS_Button} from '@nu-art/thunderstorm/frontend';
import {EditorRenderer_BaseImpl, Props_ItemEditor, State_ItemEditor} from '@nu-art/db-api-generator/frontend';
import {UI_Account} from '../../shared';


export type Props_Pathway = Props_ItemEditor<UI_Account> & {
	onCancel?: (item: EditableItem<UI_Account>) => void
}
export type ProxyServiceAccount_State = State_ItemEditor<UI_Account>

export class ProxyServiceAccount_EditorRenderer
	extends EditorRenderer_BaseImpl<UI_Account, Props_Pathway, ProxyServiceAccount_State> {

	private renderSaveButtons = () => <LL_H_C className={'buttons-container'}>
		<TS_Button onClick={() => this.props.onCancel?.(this.props.editable)}>CANCEL</TS_Button>
		<TS_Button onClick={() => this.props.editable.save()}>SAVE</TS_Button>
	</LL_H_C>;

	private renderEditorBody = () => {
		return <LL_V_L className={'form-wrapper match_height'}>
			{this.input('type').vertical('Email')}
			{this.input('displayName').vertical('displayName')}
			{this.input('email').vertical('Email')}
		</LL_V_L>;
	};

	render() {
		return <div className={'proxy-service-account-editor match_parent'}>
			{this.renderSaveButtons()}
			{this.renderEditorBody()}
		</div>;
	}
}
