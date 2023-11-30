import {md5, UniqueId} from '@nu-art/ts-common';
import {DefaultDef_Domain, DefaultDef_Group, DefaultDef_Package} from '../../shared/types';
import {CreateDefaultAccessLevels, DefaultAccessLevel_NoAccess, DefaultAccessLevel_Read} from '../../shared/consts';


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
