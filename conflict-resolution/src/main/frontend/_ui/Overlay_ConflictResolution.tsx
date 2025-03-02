import {ComponentSync} from '@nu-art/thunderstorm/frontend';

type State = {
	entityDependencies: DB_EntityDependencyV2[]
};

export class Overlay_ConflictResolution
	extends ComponentSync<{}, State> {

}