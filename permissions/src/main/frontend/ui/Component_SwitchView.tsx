import * as React from 'react';
import {ComponentSync} from '@thunder-storm/core/frontend';
import {BadImplementationException, ResolvableContent, resolveContent} from '@thunder-storm/common';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {AccessLevel} from '../modules/ModuleFE_PermissionsAssert';

type Mode = {
	key: string;
	renderer: ResolvableContent<React.ReactNode>;
	permissionKey?: PermissionKey_FE;
}

type Props = {
	mode: string;
	modes: Mode[];
};

type State = {
	mode: string;
	modes: Mode[];
};

export class Component_SwitchView
	extends ComponentSync<Props, State> {

	// ######################## Lifecycle ########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.mode = nextProps.mode;
		state.modes = nextProps.modes;
		return state;
	}

	// ######################## Logic ########################

	private getModeForKey = (key: string): Mode => {
		const mode = this.state.modes.find(mode => mode.key === key);
		if (!mode)
			throw new BadImplementationException(`No mode found for given key ${key}`);
		return mode;
	};

	// ######################## Render ########################

	render() {
		const mode = this.getModeForKey(this.state.mode);
		if (!mode.permissionKey)
			return resolveContent(mode.renderer);

		const accessLevel = mode.permissionKey.getAccessLevel();
		if (accessLevel === AccessLevel.Undefined) {
			this.logError(`Data for permission key ${mode.permissionKey.key} does not exist`);
			return;
		}

		if (accessLevel < AccessLevel.HasAccess)
			return;

		return resolveContent(mode.renderer);
	}
}