import * as React from 'react';
import {TS_BusyButton} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account} from '../../modules/ModuleFE_Account';
import {TS_Icons} from '@nu-art/ts-styles';
import './Component_GoogleSAMLLogin.scss';

type Props = {
	text?: string;
}

export const Component_GoogleSAMLLogin = (props: Props) => {

	const onClick = async () => {
		const url = ModuleFE_Account.composeSAMLUrl();
		await ModuleFE_Account.v1.loginSaml({redirectUrl: url}).executeSync();
	};

	return <TS_BusyButton
		className={'ts-account__saml-button'}
		onClick={onClick}
	>
		<div className={'ts-account__saml-button__text'}>{props.text ?? 'Login With Google'}</div>
		<TS_Icons.google.component className={'ts-account__saml-button__icon'}/>
	</TS_BusyButton>;
};