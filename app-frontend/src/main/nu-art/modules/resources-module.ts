/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module} from "@nu-art/core";

export type ResourceId = string;

export class ResourcesModule
	extends Module<void> {

	private readonly relativePath: string;
	private readonly relativePathImages: string;

	constructor() {
		super();
		this.relativePath = "../../res/";
		this.relativePathImages = `${this.relativePath}images/`;
	}

	init() {
	}

	public getImageUrl(relativePath: ResourceId): string {
		return `${this.relativePathImages}${relativePath}`
	}

}

