import * as React from 'react';
import {DB_PermissionDomain, DB_PermissionGroup, DB_PermissionProject} from '../../shared';
import {ModuleFE_PermissionsDomain, ModuleFE_PermissionsDomain_} from '../modules/manage/ModuleFE_PermissionsDomain';
import {
	ComponentSync,
	GenericDropDown,
	MandatoryProps_GenericDropDown,
	PartialProps_GenericDropDown
} from '@nu-art/thunderstorm/frontend';
import {dbObjectToId} from '@nu-art/ts-common';
import {ModuleFE_PermissionsGroup, ModuleFE_PermissionsGroup_} from '../modules/assign/ModuleFE_PermissionsGroup';
import {
	MultiSelect_Selector,
	StaticProps_TS_MultiSelect_V2,
	TS_MultiSelect_V2
} from '@nu-art/thunderstorm/frontend/components/TS_MultiSelect';
import {ModuleFE_PermissionsProject, ModuleFE_PermissionsProject_} from '../modules/manage/ModuleFE_PermissionsProject';
import {DB_PermissionAccessLevel, ModuleFE_PermissionAccessLevel} from '../_entity';
import {DropDown_PermissionAccessLevel} from '../../_entity/permission-access-level/frontend/ui-components';


type PP_GDD<T> = PartialProps_GenericDropDown<T>

type PermissionsDBTypes = {
	Project: DB_PermissionProject,
	AccessLevel: DB_PermissionAccessLevel,
	Domain: DB_PermissionDomain,
	Group: DB_PermissionGroup,
}

const Props_Project: MandatoryProps_GenericDropDown<DB_PermissionProject> = {
	module: ModuleFE_PermissionsProject,
	modules: [ModuleFE_PermissionsProject_],
	mapper: item => [item.name],
	placeholder: 'Choose a Project',
	renderer: item => <div key={item._id}>{item.name}</div>,
	sortBy: [item => item.name]
};

const Props_Domain: MandatoryProps_GenericDropDown<DB_PermissionDomain> = {
	module: ModuleFE_PermissionsDomain,
	modules: [ModuleFE_PermissionsDomain_],
	mapper: item => [item.namespace],
	placeholder: 'Choose a Domain',
	renderer: item => {
		const domainId = item!._id;
		const domain = ModuleFE_PermissionsDomain.cache.unique(domainId)!;
		return <div key={domainId}>
			{domain.namespace}
		</div>;
	},
	sortBy: [
		item => item.namespace,
	]
};

const Props_Group: MandatoryProps_GenericDropDown<DB_PermissionGroup> = {
	module: ModuleFE_PermissionsGroup,
	modules: [ModuleFE_PermissionsGroup_],
	mapper: item => [item.label],
	placeholder: 'Choose a Group',
	renderer: item => {
		const groupId = item!._id;
		const group = ModuleFE_PermissionsGroup.cache.unique(groupId)!;
		return <div key={groupId}>
			{group?.label}
		</div>;
	},
	sortBy: [
		item => item.label,
	]
};

export const Permissions_DropDown: { [K in keyof PermissionsDBTypes]: ((props: PP_GDD<PermissionsDBTypes[K]>) => JSX.Element) } = {
	Project: (props: PP_GDD<DB_PermissionProject>) =>
		<GenericDropDown<DB_PermissionProject> {...Props_Project} {...props} />,
	AccessLevel: DropDown_PermissionAccessLevel.selectable,
	Domain: (props: PP_GDD<DB_PermissionDomain>) =>
		<GenericDropDown<DB_PermissionDomain> {...Props_Domain} {...props} />,
	Group: (props: PP_GDD<DB_PermissionGroup>) => <GenericDropDown<DB_PermissionGroup> {...Props_Group} {...props} />,
};

class DomainLevelRenderer
	extends ComponentSync<MultiSelect_Selector<string>, { domainId?: string }> {

	render() {
		const selectedLevels = ModuleFE_PermissionAccessLevel.cache.filter(item => this.props.existingItems.includes(item._id));
		const availableDomainsIds = ModuleFE_PermissionsDomain.cache.filter(item => !selectedLevels.find(level => level.domainId === item._id)).map(dbObjectToId);
		return <div>
			<Permissions_DropDown.Domain
				selected={this.state.domainId}
				queryFilter={domain => availableDomainsIds.includes(domain._id)}
				onSelected={domain => this.setState({domainId: domain._id})}
			/>
			<Permissions_DropDown.AccessLevel
				disabled={!this.state.domainId}
				queryFilter={level => this.state.domainId === level.domainId}
				selected={undefined}
				onSelected={(accessLevel) => this.props.onSelected(accessLevel._id)}
			/>
		</div>;
	}

	protected deriveStateFromProps(nextProps: MultiSelect_Selector<string>, state: Partial<{
		domainId: string
	}> | undefined) {
		return {domainId: undefined, onSelected: nextProps.onSelected};
	}
}

class GroupRenderer
	extends ComponentSync<MultiSelect_Selector<{ groupId: string }>> {

	render() {
		return <div>
			<Permissions_DropDown.Group
				queryFilter={group => !this.props.existingItems.find(g => g.groupId === group._id)}
				selected={undefined}
				onSelected={group => this.props.onSelected({groupId: group._id})}
			/>
		</div>;
	}

	protected deriveStateFromProps(nextProps: PP_GDD<{ groupId: string }>, state?: {}) {
		return {onSelected: nextProps.onSelected};
	}
}

const MultiSelect_PermissionsAccessLevel: StaticProps_TS_MultiSelect_V2<string> = {
	itemRenderer: (accessLevelId, onDelete?: () => Promise<void>) => <>
		<div className="ts-icon__small" onClick={onDelete}>X</div>
		<span>{ModuleFE_PermissionAccessLevel.cache.unique(accessLevelId)?.name || 'not found'}</span></>,
	selectionRenderer: DomainLevelRenderer
};

const MultiSelect_PermissionsAccessLevelStam: StaticProps_TS_MultiSelect_V2<string> = {
	itemRenderer: (accessLevelId, onDelete?: () => Promise<void>) => <>
		<div className="ts-icon__small" onClick={onDelete}>X</div>
		<span>{ModuleFE_PermissionAccessLevel.cache.unique(accessLevelId)?.name || 'not found'}</span></>,
	selectionRenderer: (selector) => <Permissions_DropDown.AccessLevel
		queryFilter={item => {
			const selectedLevels = ModuleFE_PermissionAccessLevel.cache.filter(item => selector.existingItems.includes(item._id));
			const availableDomainsIds = ModuleFE_PermissionsDomain.cache.filter(item => !selectedLevels.find(level => level.domainId === item._id)).map(dbObjectToId);
			return availableDomainsIds.includes(item.domainId);
		}}
		onSelected={item => selector.onSelected(item._id)}/>
};

const MultiSelect_PermissionsGroup: StaticProps_TS_MultiSelect_V2<{ groupId: string }> = {
	itemRenderer: (group, onDelete?: () => Promise<void>) => <>
		<div className="ts-icon__small" onClick={onDelete}>X</div>
		<span>{ModuleFE_PermissionsGroup.cache.unique(group?.groupId)?.label || 'not found'}</span></>,
	selectionRenderer: GroupRenderer
};

export const MultiSelect = {
	AccessLevel_StamTest: TS_MultiSelect_V2.prepare(MultiSelect_PermissionsAccessLevelStam),
	AccessLevel: TS_MultiSelect_V2.prepare(MultiSelect_PermissionsAccessLevel),
	Group: TS_MultiSelect_V2.prepare(MultiSelect_PermissionsGroup),
};

