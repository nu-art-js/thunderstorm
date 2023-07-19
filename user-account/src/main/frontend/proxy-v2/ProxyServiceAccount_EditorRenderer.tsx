import * as React from 'react';
import './ProxyServiceAccount_EditorRenderer.scss';
import {EditableItem, LL_H_C, LL_V_L, TS_Button, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorRenderer_BaseImpl, Props_ItemEditor, State_ItemEditor} from '@nu-art/db-api-generator/frontend';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {ServiceAccountExtra_EditorRenderer} from './ServiceAccountExtra_EditorRenderer';
import {cloneArr, generateUUID} from '@nu-art/ts-common';

export type Props_Pathway = Props_ItemEditor<ProxyServiceAccount> & {
	onCancel?: (item: EditableItem<ProxyServiceAccount>) => void
}
export type ProxyServiceAccount_State = State_ItemEditor<ProxyServiceAccount>

export class ProxyServiceAccount_EditorRenderer
	extends EditorRenderer_BaseImpl<ProxyServiceAccount, Props_Pathway, ProxyServiceAccount_State> {

	private renderSaveButtons = () => <LL_H_C className={'buttons-container'}>
		<TS_Button onClick={() => this.props.onCancel?.(this.props.editable)}>CANCEL</TS_Button>
		<TS_Button onClick={() => this.props.editable.save()}>SAVE</TS_Button>
	</LL_H_C>;

	private renderEditorBody = () => {
		const extra = this.props.editable.editProp('extra', []);
		return <LL_V_L className={'form-wrapper match_height'}>
			{this.input('label').vertical('Label')}
			{this.input('email').vertical('Email')}
			<TS_PropRenderer.Vertical label={'APIs'}>
				{/*todo button to add one new*/}
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
		return <div className={'proxy-service-account-editor match_parent'}>
			{this.renderSaveButtons()}
			{this.renderEditorBody()}
		</div>;
	}
}
