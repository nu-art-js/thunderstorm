import {BaseDB_ApiGeneratorCaller} from "@nu-art/db-api-generator/frontend";
import {DB_GroupTags} from "../../../index";
import {ThunderDispatcher} from "@nu-art/thunderstorm/frontend";


export interface OnPermissionsTagsLoaded {
	__onPermissionsTagsLoaded: () => void
}

const dispatch_onPermissionsTagsLoaded = new ThunderDispatcher<OnPermissionsTagsLoaded, "__onPermissionsTagsLoaded">("__onPermissionsTagsLoaded");

export class PermissionsTagsModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_GroupTags> {
	private tags: DB_GroupTags[] = [];

	constructor() {
		super({key: "tags", relativeUrl: "/v1/permissions/tags/permissionsTags"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_GroupTags): Promise<void> {
		this.query();
	}

	//delete all tags in groups too
	protected async onEntryDeleted(response: DB_GroupTags): Promise<void> {
	}

	protected async onEntryUpdated(response: DB_GroupTags): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_GroupTags): Promise<void> {
	}

	protected async onQueryReturned(response: DB_GroupTags[]): Promise<void> {
		this.tags = response;
		dispatch_onPermissionsTagsLoaded.dispatchUI([]);
	}


	getTags() {
		return this.tags;
	}
}

export const ApiCaller_PermissionsTags = new PermissionsTagsModule_Class();
