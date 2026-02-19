import {TS_Icons} from '@nu-art/ts-styles';
import './Component_GoogleSAMLLogin.scss';
import {ModuleFE_Account, StorageKey_DeviceId} from '../../_entity.js';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {Button} from '@nu-art/thunder-widgets/v3';

type Props = {
	text?: string;
}

export const Component_GoogleSAMLLogin = (props: Props) => {

	const onClick = async () => {
		const url = ModuleFE_Account.composeSAMLUrl();
		const deviceId = StorageKey_DeviceId.get();
		if (!deviceId)
			throw new MUSTNeverHappenException('Missing deviceId, how did this happen?');

		await ModuleFE_Account.loginSaml({redirectUrl: url, deviceId});
	};

	return <Button
		variant={'primary'}
		className={'ts-account__saml-button'}
		onClick={onClick}
	>
		{props.text ?? 'Login With Google'}
		<TS_Icons.google.component className={'ts-account__saml-button__icon'}/>
	</Button>;
};