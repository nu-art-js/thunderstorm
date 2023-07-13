import * as React from 'react';
import './PathwayManager_Editors.scss';
import {LL_H_C, LL_V_L, TS_Button, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {Item_Editor, Props_ItemEditor, State_ItemEditor} from '@nu-art/db-api-generator/frontend';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {ServiceAccountExtra_EditorRenderer} from './ServiceAccountExtra_EditorRenderer';
import {cloneArr, generateUUID} from '@nu-art/ts-common';

export type Props_Pathway = Props_ItemEditor<ProxyServiceAccount> & {
	updateEditMode?: () => void
}
export type State = State_ItemEditor<ProxyServiceAccount>

export class ProxyServiceAccount_EditorRenderer
	extends Item_Editor<ProxyServiceAccount, Props_Pathway, State> {

	private savePathway = async () => {
		await this.props.editable.save();
	};

	private renderSaveButtons = () => <LL_H_C className={'buttons-container'}>
		<TS_Button onClick={this.props.updateEditMode}>CANCEL</TS_Button>
		<TS_Button onClick={this.savePathway}>SAVE</TS_Button>
	</LL_H_C>;

	private renderEditorBody = () => {
		const extra = this.props.editable.editProp('extra', []);
		return <LL_V_L className={'form-wrapper match_height'}>
			<div className={'title'}>{'Edit ServiceAccount'}</div>
			{this.input('label').vertical('Label')}
			{this.input('email').vertical('Email')}
			<TS_PropRenderer.Vertical label={'APIs'}>
				{extra.item.map((api, index) => {
					const currentKV = extra.editProp(index, {});
					return <ServiceAccountExtra_EditorRenderer
						key={generateUUID()}
						editable={currentKV}
						onDelete={async () => {
							const newExtras = cloneArr(this.props.editable.item.extra!);
							const deleted = newExtras.splice(index, 1);
							this.logInfo('Deleted Extra:', deleted);
							await this.props.editable.update('extra', newExtras);
							this.forceUpdate();
						}}/>;
				})}
			</TS_PropRenderer.Vertical>
		</LL_V_L>;
	};

	render() {
		return <div className={'pathway-manager-editor match_parent'}>
			{this.renderSaveButtons()}
			{this.renderEditorBody()}
		</div>;
	}
}