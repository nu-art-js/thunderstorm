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

	protected updateVersion = async () => {
		if (this.props.updateVersion) {
			this.props.updateVersion();
			return;
		}

		const url = new URL(window.location.href);
		url.searchParams.set('update', currentTimeMillis() + '');
		window.location.assign(url.toString());
	};

	protected getLatestVersion(){
		return ModuleFE_ServerInfo.Version.getLatestVersion();
	}

	protected getButtonToRender() {
		const ButtonContent = this.props.buttonContent ? this.props.buttonContent : `Version ${this.getLatestVersion()} available. Click to update`;

		return <div className={'version-update-message'} onClick={() => this.updateVersion()}>{ButtonContent}</div>;
	}

	render(): React.JSX.Element {
		const shouldUpdateVersion: boolean = ModuleFE_ServerInfo.Version.shouldUpdateVersion();
		if (!shouldUpdateVersion)
			return <></>;

		return this.getButtonToRender();
	}
}