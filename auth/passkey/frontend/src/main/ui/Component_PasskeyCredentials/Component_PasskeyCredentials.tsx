/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {Button} from '@nu-art/thunder-widgets/v3';
import type {DB_PasskeyCredential} from '@nu-art/passkey-shared';
import {ModuleFE_PasskeyAuth} from '../../ModuleFE_PasskeyAuth.js';
import {ModuleFE_PasskeyCredentialDB} from '../../_entity/passkey-credential/ModuleFE_PasskeyCredentialDB.js';
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
			await ModuleFE_PasskeyCredentialDB.query();
		} catch (e: any) {
			// Error handled by dispatch
		} finally {
			setDeletingId(undefined);
		}
	};

	if (props.credentials.length === 0)
		return <div className={'ts-passkey-credentials__empty'}>
			No passkeys registered. Add one to enable passwordless login.
		</div>;

	return <div className={'ts-passkey-credentials'}>
		{props.credentials.map(credential => (
			<div key={credential._id} className={'ts-passkey-credentials__item'}>
				<div className={'ts-passkey-credentials__info'}>
					<span className={'ts-passkey-credentials__label'}>{credential.label}</span>
					<span className={'ts-passkey-credentials__meta'}>
						{credential.lastUsedAt
							? `Last used: ${new Date(credential.lastUsedAt).toLocaleDateString()}`
							: 'Never used'}
						{credential.backedUp && ' • Synced'}
					</span>
				</div>
				<Button
					variant={'danger'}
					className={'ts-passkey-credentials__delete'}
					onClick={() => onDelete(credential)}
					disabled={deletingId === credential.credentialId}
				>
					{deletingId === credential.credentialId ? 'Removing...' : 'Remove'}
				</Button>
			</div>
		))}
	</div>;
};
