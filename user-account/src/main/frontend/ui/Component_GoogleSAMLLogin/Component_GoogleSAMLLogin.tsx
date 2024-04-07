import * as React from 'react';
import {TS_BusyButton} from '@nu-art/thunderstorm/frontend';
import {TS_Icons} from '@nu-art/ts-styles';
import './Component_GoogleSAMLLogin.scss';
import {ModuleFE_Account} from '../../../_entity/account/frontend/ModuleFE_Account';
import {StorageKey_DeviceId} from '../../core/consts';


type Props = {
	text?: string;
}

export const Component_GoogleSAMLLogin = (props: Props) => {

	const onClick = async () => {
		const url = ModuleFE_Account.composeSAMLUrl();
		await ModuleFE_Account.vv1.loginSaml({redirectUrl: url, deviceId: StorageKey_DeviceId.get()}).executeSync();
	};

	return <TS_BusyButton
		className={'ts-account__saml-button'}
		onClick={onClick}
	>
		<div className={'ts-account__saml-button__text'}>{props.text ?? 'Login With Google'}</div>
		<TS_Icons.google.component className={'ts-account__saml-button__icon'}/>
	</TS_BusyButton>;
};