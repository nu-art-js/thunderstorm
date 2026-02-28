import {_values, md5, TypedMap} from '@nu-art/ts-common';
import {
	CreateDefaultAccessLevels,
	DatabaseDef_PermissionDomain,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultDef_AccessLevel,
	DefaultDef_Group,
	PreDBAccessLevel,
	toPermissionDomainId,
	toPermissionGroupId
} from '@nu-art/permissions-shared';
import {defaultValueResolverV2, PermissionKey_BE} from '../PermissionKey_BE.js';
import {DefaultDef_Domain, DefaultDef_Package} from '../types.js';


export const Permissions_abTest = (seed: string, namespace: string, permutations: string[]) => {
	const domains = permutations.map(permutation => {
		const name = `${namespace}/${permutation}`;
		const domain: DefaultDef_Domain = {
			_id: toPermissionDomainId(md5(`${seed}${name}`)),
			namespace: name,
			permissionKeys: permutations.map(permutation => {
				const initialDataResolver = () => defaultValueResolverV2(domain._id, DefaultAccessLevel_Read.name);
				return new PermissionKey_BE(`${namespace}/${permutation}`, initialDataResolver);
			}),
			levels: CreateDefaultAccessLevels(seed, [DefaultAccessLevel_NoAccess, DefaultAccessLevel_Read]) as DefaultDef_AccessLevel[],
		};

		return domain;
	});

	const groups = permutations.map((permutation, index) => {
		const name = `${namespace}/${permutation}`;
		const domain = domains[index];
		const group: DefaultDef_Group = {
			_id: toPermissionGroupId(md5(`${domain._id}/${name}`)),
			name,
			uiLabel: name,
			accessLevels: {
				[domain.namespace]: DefaultAccessLevel_Read.name,
			}
		};

		return group;
	});

	const Permission_Package: DefaultDef_Package = {
		name: namespace,
		domains: domains,
		groups: groups
	};

	return Permission_Package;
};

/**
 * Generate automatic BE permission keys for a domain
 * @param accessLevels the relevant access levels to generate keys for
 * @param keyByLevelMapper the key name mapper by access level name
 * @param domainId the domain id to apply in the resolver
 */
export const generatePermissionKeys = <Key extends string | number | symbol>(accessLevels: PreDBAccessLevel[], keyByLevelMapper: TypedMap<string>, domainId: DatabaseDef_PermissionDomain['id']): { [key in Key]: PermissionKey_BE<string> } => {
	return accessLevels.reduce((mapper, currentAccessLevel) => {
		// declare default
		const key = keyByLevelMapper[currentAccessLevel.name];
		// update acc mapper
		mapper[currentAccessLevel.name as Key] = new PermissionKey_BE(key, () => defaultValueResolverV2(domainId, currentAccessLevel.name));

		return mapper;
	}, {} as { [key in Key]: PermissionKey_BE<string> });
};

/**
 * Automatic generator for domain default definitions,
 * @param key MUST NEVER CHANGE! the key is the "key" to uniqueness of the entire permission decleration
 * @param namespace The name space of the current generated domain definitions
 * @param preDBAccessLevels The access levels to create (can be default or custom)
 * @param permissionKeysByLevel The permission key name for each access level
 * @param dbNames List of db names (optional)
 */
export const generateDomainDefaults = <Key extends string | number | symbol>(key: string, namespace: string, preDBAccessLevels: PreDBAccessLevel[], permissionKeysByLevel: { [key in Key]: string }, dbNames?: string[]): {
	domain: DefaultDef_Domain
	groups: DefaultDef_Group[]
	keys: { [key in Key]: PermissionKey_BE<string> }
} => {
	// Generate the new domain id
	const newDomainId = toPermissionDomainId(md5(`domain/${key}`));

	// Get all default db ready access levels using the provided ones
	const accessLevels = CreateDefaultAccessLevels(md5(`domain/${key}`), preDBAccessLevels) as DefaultDef_AccessLevel[];

	const keyDefinitions = generatePermissionKeys<Key>(preDBAccessLevels, permissionKeysByLevel, newDomainId);

	return {
		domain: {
			_id: newDomainId,
			namespace,
			permissionKeys: _values(keyDefinitions),
			levels: accessLevels,
			dbNames
		},
		groups: accessLevels.map(accessLevel => ({
			_id: toPermissionGroupId(md5(`${key}/${accessLevel.name}`)),
			name: `${namespace}/${accessLevel.name}`,
			uiLabel: `${namespace}/${accessLevel.name}`,
			accessLevels: {
				[namespace]: accessLevel.name
			}
		})),
		keys: keyDefinitions
	};
};