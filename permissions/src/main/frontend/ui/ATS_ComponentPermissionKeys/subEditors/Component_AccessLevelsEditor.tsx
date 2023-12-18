import * as React from 'react';
import {ComponentSync, LL_V_L, TS_Button} from '@nu-art/thunderstorm/frontend';
import {dbObjectToId} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel} from '../../../../shared';
import {Permissions_DropDown} from '../../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PermissionsDomain} from '../../../modules/manage/ModuleFE_PermissionsDomain';
import {PermissionKey_FE} from '../../../PermissionKey_FE';
import {ModuleFE_PermissionsAccessLevel} from '../../../modules/manage/ModuleFE_PermissionsAccessLevel';

type Props = {
	permissionKey: PermissionKey_FE;
}
type State = {
	levels: DB_PermissionAccessLevel[];
}

export class Component_AccessLevelsEditor
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		const levelIds = nextProps.permissionKey.get().accessLevelIds ?? [];
		state.levels = ModuleFE_PermissionsAccessLevel.cache.filter(i => levelIds.includes(i._id));
		return state;
	}

	private renderTag(level: DB_PermissionAccessLevel) {
		return <div className={'level'} key={level._id}>
			<TS_Button onClick={async () => {
				const levels = this.state.levels.filter(i => i._id !== level._id);
				await this.props.permissionKey.set({accessLevelIds: levels.map(dbObjectToId)});
				this.reDeriveState();
			}}><TS_Icons.x.component/></TS_Button>
			<span>{level.name}</span>
		</div>;
	}

	private renderLevelDropDown = () => {
		return <Permissions_DropDown.AccessLevel
			queryFilter={(item) => {
				return !this.state.levels.map(i => i._id).includes(item._id);
			}}
			mapper={level => {
				const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
				return [domain.namespace, level.name, String(level.value)];
			}}
			className={'access-levels-dropdown'}
			selected={undefined}
			onSelected={async level => {
				const levels = [...this.state.levels, level];
				await this.props.permissionKey.set({accessLevelIds: levels.map(dbObjectToId)});
				this.reDeriveState();
			}}
			placeholder={'New Access Level'}
			caret={{
				open: <div className={'caret open'}><TS_Icons.treeCollapse.component style={{rotate: '90'}}/></div>,
				close: <div className={'caret close'}><TS_Icons.treeCollapse.component style={{rotate: '-90'}}/>
				</div>,
			}}
			boundingParentSelector={'.ts-tabs__content'}
		/>;
	};

	render() {
		return (
			<LL_V_L className={'access-levels-section'}>
				<LL_V_L className={'access-levels'}>
					{this.state.levels.map(level => this.renderTag(level))}
					{this.renderLevelDropDown()}
				</LL_V_L>
			</LL_V_L>
		);
	}
}