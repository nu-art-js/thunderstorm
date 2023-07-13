import * as React from 'react';
import {ComponentSync, EditableItem, LL_V_L} from '@nu-art/thunderstorm/frontend';
import {ProxyServiceAccount_EditorRenderer} from './ProxyServiceAccount_EditorRenderer';
import {generateUUID} from '@nu-art/ts-common';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';

type Props = {};

type State = {
	serviceAccount: ProxyServiceAccount[]
};

export class ServiceAccountEditor
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state ??= {serviceAccount: []};
		state.serviceAccount ??= [];
		return state;
	}

	render() {
		return <LL_V_L>
			{this.state?.serviceAccount?.map(serviceAcc => {
				const editableItem = new EditableItem<ProxyServiceAccount>(serviceAcc,
					async (item) => {
						return;
					}, async (item) => {
					});
				return <ProxyServiceAccount_EditorRenderer key={generateUUID()}
														   editable={editableItem}/>;
			})}
		</LL_V_L>;
	}
}

export const PgDev_ProxyV2 = {name: 'Proxy V2 Editor', renderer: ServiceAccountEditor};