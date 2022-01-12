import {BaseDB_ApiGenerator, tsValidateStringAndNumbersWithDashes} from '@nu-art/db-api-generator/backend';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase';
import {ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {tsValidateRegexp, TypeValidator,} from '@nu-art/ts-common';
import {DB_GroupTags} from '../..';
import {GroupPermissionsDB} from './db-types/assign';

const validateGroupLabel = tsValidateRegexp(/^[A-Za-z-\._ ]+$/);

export const CollectionNameTags = 'permissions--tags';


export class TagsDB_Class
	extends BaseDB_ApiGenerator<DB_GroupTags> {

	static _validator: TypeValidator<DB_GroupTags> = {
		...BaseDB_ApiGenerator.__validator,
		_id: tsValidateStringAndNumbersWithDashes,
		label: validateGroupLabel
	};

	constructor() {
		super(CollectionNameTags, TagsDB_Class._validator, 'permissionsTags');
	}


	protected internalFilter(item: DB_GroupTags): Clause_Where<DB_GroupTags>[] {
		const {label} = item;
		return [{label}];
	}

	async delete(query: FirestoreQuery<DB_GroupTags>, request?: ExpressRequest) {
		query.where?._id && await GroupPermissionsDB.deleteTags(query.where?._id.toString());
		return super.delete(query, request);
	}

	apiPatch(pathPart?: string): ServerApi<any> | undefined {
		return;
	}
}

export const TagsDB = new TagsDB_Class();



