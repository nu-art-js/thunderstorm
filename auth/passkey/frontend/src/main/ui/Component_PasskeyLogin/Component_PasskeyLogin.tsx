/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {Button} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_PasskeyAuth} from '../../ModuleFE_PasskeyAuth.js';
import './Component_PasskeyLogin.scss';

type Props = {
	text?: string;
	onError?: (error: string) => void;
};

export const Component_PasskeyLogin = (props: Props) => {
	const [error, setError] = useState<string>();
	const [inProgress, setInProgress] = useState(false);

	if (!ModuleFE_PasskeyAuth.browserSupportsPasskeys())
		return null;

	const onLogin = async () => {
		setError(undefined);
		setInProgress(true);
		try {
			await ModuleFE_PasskeyAuth.login();
		} catch (e: any) {
			const message = e.name === 'NotAllowedError'
				? 'Passkey authentication was cancelled'
				: (e.message ?? 'Passkey login failed');
			setError(message);
			props.onError?.(message);
		} finally {
			setInProgress(false);
		}
	};

	return <div className={'ts-passkey-login'}>
		{error && <div className={'ts-passkey-login__error'}>{error}</div>}
		<Button
			variant={'secondary'}
			className={'ts-passkey-login__button'}
			onClick={onLogin}
			disabled={inProgress}
		>
			{inProgress ? 'Authenticating...' : (props.text ?? 'Sign in with passkey')}
		</Button>
	</div>;
};
