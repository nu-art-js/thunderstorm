import {
	BaseDB_ApiGenerator,
	ServerApi_Create,
	ServerApi_Delete,
	ServerApi_Query,
	ServerApi_Unique,
	validateStringAndNumbersWithDashes
} from "@nu-art/db-api-generator/backend";
import {Clause_Where} from "@nu-art/firebase";
import {ServerApi} from "@nu-art/thunderstorm/backend";
import {
	TypeValidator,
	validateRegexp,
} from "@nu-art/ts-common";
import {DB_GroupTags} from "../..";

const validateGroupLabel = validateRegexp(/^[A-Za-z-\._ ]+$/);

export const CollectionNameTags = 'permissions--tags';


export class TagsDB_Class
	extends BaseDB_ApiGenerator<DB_GroupTags> {

	static _validator: TypeValidator<DB_GroupTags> = {
		_id: validateStringAndNumbersWithDashes,
		label: validateGroupLabel
	};

	constructor() {
		super(CollectionNameTags, TagsDB_Class._validator, "permissionsTags");
	}


	protected internalFilter(item: DB_GroupTags): Clause_Where<DB_GroupTags>[] {
		const {label} = item;
		return [{label}];
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [
			new ServerApi_Delete(this, pathPart),
			new ServerApi_Query(this, pathPart),
			new ServerApi_Unique(this, pathPart),
			new ServerApi_Create(this, pathPart)
		];
	}
}

export const TagsDB = new TagsDB_Class();



