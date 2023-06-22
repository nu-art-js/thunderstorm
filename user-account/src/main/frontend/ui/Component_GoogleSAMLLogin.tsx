import * as React from 'react';
import {TS_BusyButton} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account} from '../modules/ModuleFE_Account';

export const Component_GoogleSAMLLogin = () => {

	const onClick = async () => {
		const url = ModuleFE_Account.composeSAMLUrl();
		await ModuleFE_Account.v1.loginSaml({redirectUrl: url}).executeSync();
	};

	return <TS_BusyButton
		className={'ts-account_saml-button'}
		onClick={onClick}
	>Login With Google</TS_BusyButton>;
};