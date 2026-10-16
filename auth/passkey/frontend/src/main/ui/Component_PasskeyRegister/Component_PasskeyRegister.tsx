/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {Button, LL_V_L, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_Input} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_PasskeyAuth} from '../../ModuleFE_PasskeyAuth.js';
import {ModuleFE_PasskeyCredentialDB} from '../../_entity/passkey-credential/ModuleFE_PasskeyCredentialDB.js';
import './Component_PasskeyRegister.scss';

type Props = {
	text?: string;
	onSuccess?: () => void;
	onError?: (error: string) => void;
};

export const Component_PasskeyRegister = (props: Props) => {
	const [label, setLabel] = useState('');
	const [error, setError] = useState<string>();
	const [success, setSuccess] = useState(false);
	const [inProgress, setInProgress] = useState(false);

	if (!ModuleFE_PasskeyAuth.browserSupportsPasskeys())
		return <LL_V_L className={'ts-passkey-register'}>
			<div className={'ts-passkey-register__unsupported'}>Your browser does not support passkeys.</div>
		</LL_V_L>;

	const onRegister = async () => {
		setError(undefined);
		setSuccess(false);
		setInProgress(true);

		const credentialLabel = label.trim() || `Passkey ${new Date().toLocaleDateString()}`;

		try {
			await ModuleFE_PasskeyAuth.register(credentialLabel);
			setSuccess(true);
			setLabel('');
			await ModuleFE_PasskeyCredentialDB.query();
			props.onSuccess?.();
		} catch (e: any) {
			const message = e.name === 'NotAllowedError'
				? 'Passkey registration was cancelled'
				: (e.message ?? 'Passkey registration failed');
			setError(message);
			props.onError?.(message);
		} finally {
			setInProgress(false);
		}
	};

	return <LL_V_L className={'ts-passkey-register'}>
		<TS_PropRenderer.Vertical label={'Passkey name'}>
			<TS_Input
				id={'passkey-register-label'}
				type={'text'}
				value={label}
				placeholder={'MacBook Pro'}
				disabled={inProgress}
				onChange={setLabel}
			/>
		</TS_PropRenderer.Vertical>
		{error && <div className={'ts-passkey-register__error'}>{error}</div>}
		{success && <div className={'ts-passkey-register__success'}>Passkey registered.</div>}
		<Button
			id={'passkey-register-add'}
			variant={'primary'}
			actionInProgress={inProgress}
			disabled={inProgress}
			onClick={() => void onRegister()}
		>
			{props.text ?? 'Add passkey'}
		</Button>
	</LL_V_L>;
};
