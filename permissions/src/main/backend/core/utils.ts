import {md5, TypedMap, UniqueId} from '@nu-art/ts-common';
import {DefaultDef_Domain, DefaultDef_Group, DefaultDef_Package, PreDBAccessLevel} from '../../shared/types';
import {
	CreateDefaultAccessLevels,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
} from '../../shared/consts';
import {defaultValueResolverV2, PermissionKey_BE} from '../PermissionKey_BE';


export const Permissions_abTest = (seed: UniqueId, namespace: string, permutations: string[]) => {
	const domains = permutations.map(permutation => {
		const name = `${namespace}/${permutation}`;
		const domain: DefaultDef_Domain = {
			_id: md5(`${seed}${name}`),
			namespace: name,
			permissionKeys: permutations.map(permutation => {
				const initialDataResolver = () => defaultValueResolverV2(domain._id, DefaultAccessLevel_Read.name);
				return new PermissionKey_BE(`${namespace}/${permutation}`, initialDataResolver);
			}),
			levels: CreateDefaultAccessLevels(seed, [DefaultAccessLevel_NoAccess, DefaultAccessLevel_Read]),
		};

		return domain;
	});

	const groups = permutations.map((permutation, index) => {
		const name = `${namespace}/${permutation}`;
		const domain = domains[index];
		const group: DefaultDef_Group = {
			_id: md5(`${domain._id}/${name}`),
			name,
			accessLevels: {
				[domain._id]: DefaultAccessLevel_Read.name,
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
export const generatePermissionKeys = (accessLevels: PreDBAccessLevel[], keyByLevelMapper: TypedMap<string>, domainId: UniqueId): {
	configKeys: PermissionKey_BE<string>[]
} => {
	return accessLevels.reduce((mapper, currentAccessLevel) => {
		// declare default
		const key = keyByLevelMapper[currentAccessLevel.name];
		const permissionKeyBE = new PermissionKey_BE(key, () => defaultValueResolverV2(domainId, currentAccessLevel.name));

		// update acc mapper
		mapper.configKeys.push(permissionKeyBE);

		return mapper;
	}, {configKeys: []} as { configKeys: PermissionKey_BE<string>[] });
};

/**
 * Automatic generator for domain default definitions,
 * @param key MUST NEVER CHANGE! the key is the "key" to uniqueness of the entire permission decleration
 * @param namespace The name space of the current generated domain definitions
 * @param preDBAccessLevels The access levels to create (can be default or custom)
 * @param permissionKeysByLevel The permission key name for each access level
 * @param dbNames List of db names (optional)
 */
export const generateDomainDefaults = (key: string, namespace: string, preDBAccessLevels: PreDBAccessLevel[], permissionKeysByLevel: TypedMap<string>, dbNames?: string[]): {
	domain: DefaultDef_Domain
	groups: DefaultDef_Group[]
} => {
	// Generate the new domain id
	const newDomainId = md5(`domain/${key}`);

	// Get all default db ready access levels using the provided ones
	const accessLevels = CreateDefaultAccessLevels(newDomainId, preDBAccessLevels);

	const keyDefinitions = generatePermissionKeys(preDBAccessLevels, permissionKeysByLevel, newDomainId);

	return {
		domain: {
			_id: newDomainId,
			namespace,
			permissionKeys: keyDefinitions.configKeys,
			levels: accessLevels,
			dbNames
		},
		groups: accessLevels.map(accessLevel => ({
			_id: md5(`${key}/${accessLevel.name}`),
			name: `${namespace}/${accessLevel.name}`,
			accessLevels: {
				[namespace]: accessLevel.name
			}
		})),
	};
};