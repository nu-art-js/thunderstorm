import * as React from 'react';
import './PathwayManager_Editors.scss';
import {LL_V_L} from '@nu-art/thunderstorm/frontend';
import {EditorRenderer_BaseImpl, Props_ItemEditor, State_ItemEditor} from '@nu-art/db-api-generator/frontend';
import {ServiceAccountApi} from '../../shared/proxy-v2/types';

export type Props_Extra = Props_ItemEditor<ServiceAccountApi> & {
	updateEditMode?: () => void
	onDelete: () => void
}
export type State = State_ItemEditor<ServiceAccountApi>

export class ServiceAccountExtra_EditorRenderer
	extends EditorRenderer_BaseImpl<ServiceAccountApi, Props_Extra, State> {

	render() {
		return <LL_V_L className={'form-wrapper match_height'}>
			<div className={'title'}>{'Edit Pathway'}</div>
			{this.input('key').vertical('Key')}
			{this.input('value').vertical('Value')}
		</LL_V_L>;
	}
}