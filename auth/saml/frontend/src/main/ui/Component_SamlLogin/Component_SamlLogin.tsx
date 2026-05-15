import * as React from 'react';
import {useState} from 'react';
import {StorageKey_DeviceId} from '@nu-art/user-account-frontend';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {Button} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_SAML} from '../../ModuleFE_SAML.js';
import './Component_SamlLogin.scss';

type Props = {
	text?: string;
	placeholder?: string;
}

export const Component_SamlLogin = (props: Props) => {
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string>();

	const onSubmit = async () => {
		setError(undefined);

		if (!email.includes('@')) {
			setError('Please enter a valid email address');
			return;
		}

		const redirectUrl = ModuleFE_SAML.composeSAMLUrl();
		const deviceId = StorageKey_DeviceId.get();
		if (!deviceId)
			throw new MUSTNeverHappenException('Missing deviceId');

		try {
			await ModuleFE_SAML.loginSaml({email, redirectUrl, deviceId});
		} catch (e: any) {
			setError(e.message ?? 'SAML login failed');
		}
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter')
			void onSubmit();
	};

	return <div className={'ts-saml-login'}>
		<input
			className={'ts-saml-login__input'}
			type={'email'}
			value={email}
			onChange={e => setEmail(e.target.value)}
			onKeyDown={onKeyDown}
			placeholder={props.placeholder ?? 'Enter your work email'}
		/>
		{error && <div className={'ts-saml-login__error'}>{error}</div>}
		<Button
			variant={'primary'}
			className={'ts-saml-login__button'}
			onClick={onSubmit}
		>
			{props.text ?? 'Login with SSO'}
		</Button>
	</div>;
};
