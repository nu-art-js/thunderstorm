import React from 'react';
import {ComponentSync} from '../core/ComponentSync';
import {ModuleFE_ServerInfo, OnServerInfoUpdatedListener} from './ModuleFE_ServerInfo';
import './Button_VersionUpdate.scss';

export type Props = {
	updateVersion?: () => void // in case someone would like a customized updateVersion process
}

export class Button_VersionUpdate
	extends ComponentSync<Props>
	implements OnServerInfoUpdatedListener {

	__onServerInfoUpdated = () => {
		this.forceUpdate();
	};

	private updateVersion = async () => {
		if (this.props.updateVersion) {
			this.props.updateVersion();
			return;
		}

		window.location.reload();
	};

	render(): React.JSX.Element {
		const shouldUpdateVersion: boolean = ModuleFE_ServerInfo.Version.shouldUpdateVersion();
		const newVersion: string = ModuleFE_ServerInfo.Version.getLatestVersion();
		if (!shouldUpdateVersion)
			return <></>;

		return <div className={'version-update-message'} onClick={() => this.updateVersion()}>
			{`Version ${newVersion} available. Click to update`}
		</div>;
	}
}