/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {Button, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import type {DB_PasskeyCredential} from '@nu-art/passkey-shared';
import {ModuleFE_PasskeyAuth} from '../../ModuleFE_PasskeyAuth.js';
import './Component_PasskeyCredentials.scss';

type Props = {
	credentials: DB_PasskeyCredential[];
};

export const Component_PasskeyCredentials = (props: Props) => {
	const [deletingId, setDeletingId] = useState<string>();

	const onDelete = async (credential: DB_PasskeyCredential) => {
		setDeletingId(credential.credentialId);
		try {
			await ModuleFE_PasskeyAuth.deleteCredential({credentialId: credential.credentialId});
		} catch (e: any) {
			// Error handled by dispatch
		} finally {
			setDeletingId(undefined);
		}
	};

	if (props.credentials.length === 0)
		return <LL_V_L className={'ts-passkey-credentials'}>
			<div className={'ts-passkey-credentials__empty'}>No passkeys yet. Add one to sign in on the apex.</div>
		</LL_V_L>;

	return <LL_V_L className={'ts-passkey-credentials'}>
		{props.credentials.map(credential => (
			<LL_H_C key={credential._id} className={'ts-passkey-credentials__item'}>
				<LL_V_L className={'ts-passkey-credentials__info'}>
					<div className={'ts-passkey-credentials__label'}>{credential.label}</div>
					<div className={'ts-passkey-credentials__meta'}>
						{credential.lastUsedAt
							? `Last used ${new Date(credential.lastUsedAt).toLocaleDateString()}`
							: 'Never used'}
						{credential.backedUp && ' · Synced'}
					</div>
				</LL_V_L>
				<Button
					id={`passkey-remove-${credential._id}`}
					variant={'dangerous'}
					actionInProgress={deletingId === credential.credentialId}
					disabled={deletingId === credential.credentialId}
					onClick={() => void onDelete(credential)}
				>
					Remove
				</Button>
			</LL_H_C>
		))}
	</LL_V_L>;
};
