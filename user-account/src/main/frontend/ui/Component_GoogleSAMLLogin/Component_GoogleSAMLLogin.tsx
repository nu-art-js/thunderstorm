import * as React from 'react';
import {TS_BusyButton} from '@thunder-storm/core/frontend';
import {TS_Icons} from '@thunder-storm/styles';
import './Component_GoogleSAMLLogin.scss';
import {ModuleFE_Account, StorageKey_DeviceId} from '../../_entity';
import {MUSTNeverHappenException} from '@thunder-storm/common';

type Props = {
	text?: string;
}

export const Component_GoogleSAMLLogin = (props: Props) => {

	const onClick = async () => {
		const url = ModuleFE_Account.composeSAMLUrl();
		const deviceId = StorageKey_DeviceId.get();
		if (!deviceId)
			throw new MUSTNeverHappenException('Missing deviceId, how did this happen?');

		await ModuleFE_Account._v1.loginSaml({redirectUrl: url, deviceId}).executeSync();
	};

	return <TS_BusyButton
		className={'ts-account__saml-button'}
		onClick={onClick}
	>
		<div className={'ts-account__saml-button__text'}>{props.text ?? 'Login With Google'}</div>
		<TS_Icons.google.component className={'ts-account__saml-button__icon'}/>
	</TS_BusyButton>;
};