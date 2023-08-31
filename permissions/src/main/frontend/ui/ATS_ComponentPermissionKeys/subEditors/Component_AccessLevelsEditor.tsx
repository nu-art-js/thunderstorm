import * as React from 'react';
import {ComponentSync, LL_V_L, TS_Button} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel} from '../../../../shared';
import {Permissions_DropDown} from '../../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PermissionsDomain} from '../../../modules/manage/ModuleFE_PermissionsDomain';

type Props = {
	levels: Partial<DB_PermissionAccessLevel>[]
	onChange?: () => void
}
type State = {}

export class Component_AccessLevelsEditor
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props) {
		return {};
	}

	renderTag(level: Partial<DB_PermissionAccessLevel>) {
		return <div className={'level'} key={level._id}>
			<TS_Button onClick={() => {
				const index = this.props.levels.findIndex(_level => _level._id === level._id);
				if (index === -1)
					throw new BadImplementationException(`Can't find accessLevel with id ${level._id}`);
				this.props.levels.splice(index, 1);
				this.forceUpdate();
				this.props.onChange?.();
			}}><TS_Icons.x.component/></TS_Button>
			<span>{level.name}</span>
		</div>;
	}

	renderInnerAccessLevels() {
		return <LL_V_L className={'access-levels'}>
			{/*render provided levels*/}
			{this.props.levels.map(level => this.renderTag(level))}
			{/*render dropdown to add levels*/}
			<Permissions_DropDown.AccessLevel
				queryFilter={(item) => {
					return !this.props.levels.map(i => i._id).includes(item._id);
				}}
				mapper={level => {
					const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
					return [domain.namespace, level.name, String(level.value)];
				}}
				className={'access-levels-dropdown'}
				selected={undefined}
				onSelected={level => {
					if (!this.props.levels.map(_level => _level._id).includes(level._id))
						this.props.levels.push(level);
					this.forceUpdate();
					this.props.onChange?.();
				}}
				placeholder={'New Access Level'}
				caret={{
					open: <div className={'caret open'}><TS_Icons.treeCollapse.component style={{rotate: '90'}}/></div>,
					close: <div className={'caret close'}><TS_Icons.treeCollapse.component style={{rotate: '-90'}}/>
					</div>,
				}}
				boundingParentSelector={'.ts-tabs__content'}
			/>
		</LL_V_L>;
	}

	render() {
		return (
			<LL_V_L className={'access-levels-section'}>
				{this.renderInnerAccessLevels()}
			</LL_V_L>
		);
	}
}