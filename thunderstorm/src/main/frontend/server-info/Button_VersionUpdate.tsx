import React from 'react';
import {ComponentSync} from '../core/ComponentSync';
import {ModuleFE_ServerInfo, OnServerInfoUpdatedListener} from './ModuleFE_ServerInfo';
import './Button_VersionUpdate.scss';
import {currentTimeMillis} from '@nu-art/ts-common';

export type Props = {
	updateVersion?: () => void // in case someone would like a customized updateVersion process
	buttonContent?: React.JSX.Element
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

		const url = new URL(window.location.href);
		url.searchParams.set('update', currentTimeMillis() + '');
		window.location.assign(url.toString());
	};

	render(): React.JSX.Element {
		const shouldUpdateVersion: boolean = ModuleFE_ServerInfo.Version.shouldUpdateVersion();
		const newVersion: string = ModuleFE_ServerInfo.Version.getLatestVersion();
		if (!shouldUpdateVersion)
			return <></>;

		const ButtonContent = this.props.buttonContent ? this.props.buttonContent : `Version ${newVersion} available. Click to update`;

		return <div className={'version-update-message'} onClick={() => this.updateVersion()}>{ButtonContent}</div>;
	}
}