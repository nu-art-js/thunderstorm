import {
	GenericDropDown,
	MandatoryProps_GenericDropDown,
	PartialProps_GenericDropDown,
	TS_MultiSelect,
	TS_MultiSelect_Renderer
} from '@nu-art/db-api-generator/frontend';
import * as React from 'react';
import {DB_PermissionAccessLevel, DB_PermissionDomain} from '../../shared';
import {ModuleFE_PermissionsAccessLevel, ModuleFE_PermissionsAccessLevel_} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {ModuleFE_PermissionsDomain, ModuleFE_PermissionsDomain_} from '../modules/manage/ModuleFE_PermissionsDomain';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import {dbObjectToId} from '@nu-art/ts-common';


type PP_GDD<T> = PartialProps_GenericDropDown<T>

type AllTypesDB = {
	AccessLevel: DB_PermissionAccessLevel,
	Domain: DB_PermissionDomain,
	// Group:DB_PermissionGroup,
}

const Props_AccessLevel: MandatoryProps_GenericDropDown<DB_PermissionAccessLevel> = {
	module: ModuleFE_PermissionsAccessLevel,
	modules: [ModuleFE_PermissionsAccessLevel_],
	mapper: item => [item.name],
	placeholder: 'Choose a Access Level',
	renderer: item => {
		const levelId = item!._id;
		const level = ModuleFE_PermissionsAccessLevel.cache.unique(levelId)!;
		const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
		return <div key={levelId}>
			{`${domain.namespace}: ${level.name} (${level.value})`}
		</div>;
	},
	sortBy: [
		item => item.value,
		item => ModuleFE_PermissionsDomain.cache.unique(item.domainId)!.namespace
	]
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

export const DropDown: { [K in keyof AllTypesDB]: ((props: PP_GDD<AllTypesDB[K]>) => JSX.Element) } = {
	AccessLevel: (props: PP_GDD<DB_PermissionAccessLevel>) => <GenericDropDown<DB_PermissionAccessLevel> {...Props_AccessLevel} {...props} />,
	Domain: (props: PP_GDD<DB_PermissionDomain>) => <GenericDropDown<DB_PermissionDomain> {...Props_Domain} {...props} />,
};

class DomainLevelRenderer
	extends ComponentSync<PP_GDD<DB_PermissionAccessLevel>, { domainId?: string }> {

	render() {
		const selectedLevels = ModuleFE_PermissionsAccessLevel.cache.filter(item => !this.props.queryFilter!(item));
		const availableDomainsIds = ModuleFE_PermissionsDomain.cache.filter(item => !selectedLevels.find(level => level.domainId === item._id)).map(dbObjectToId);
		return <div>
			<DropDown.Domain
				selected={this.state.domainId}
				queryFilter={domain => availableDomainsIds.includes(domain._id)}
				onSelected={domain => this.setState({domainId: domain._id})}
			/>
			<DropDown.AccessLevel
				disabled={!this.state.domainId}
				queryFilter={level => this.state.domainId === level.domainId}
				selected={undefined}
				onSelected={this.props.onSelected}
			/>
		</div>;
	}

	protected deriveStateFromProps(nextProps: PP_GDD<DB_PermissionAccessLevel>, state: Partial<{ domainId: string; levelId: string }> | undefined) {
		return {domainId: undefined};
	}
}

const MultiSelect_PermissionsAccessLevel: TS_MultiSelect_Renderer<DB_PermissionAccessLevel> = {
	label: 'Access Level',
	placeholder: 'Select Access Level',
	noOptionsRenderer: '---',
	module: ModuleFE_PermissionsAccessLevel,
	itemRenderer: (accessLevel, onDelete?: () => Promise<void>) => <>
		<div className="ts-icon__small" onClick={onDelete}>X</div>
		<span>{accessLevel?.name || 'not found'}</span></>,
	selectionRenderer: DomainLevelRenderer
};

export const MultiSelect = {
	AccessLevel: TS_MultiSelect.prepare(MultiSelect_PermissionsAccessLevel),
};

