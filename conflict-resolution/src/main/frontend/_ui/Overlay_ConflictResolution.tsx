import {DBEntityDependencies} from '@nu-art/thunderstorm';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';

type State = {
	entityDependencies: DBEntityDependencies
};

export class Overlay_ConflictResolution
	extends ComponentSync<{}, State> {

}