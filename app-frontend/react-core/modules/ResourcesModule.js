/**
 * Created by tacb0ss on 27/07/2018.
 */

import Module from '../core/Module';

class ResourcesModule
	extends Module {

	init() {
		this.relativePath = "../../res/";
		this.relativePathImages = `${this.relativePath}images/`;
	}

	getImageUrl(relativePath) {
		return `${this.relativePathImages}${relativePath}`
	}

}

export default new ResourcesModule();
