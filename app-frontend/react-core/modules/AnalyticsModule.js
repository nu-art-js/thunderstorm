/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';

class AnalyticsModule
	extends Module {

	constructor() {
		super();
	}

	sendEvent(category, action, label, count) {
		this.logInfo(`TODO: send-event: ${category} ${action} ${label} ${count}`);
	}
}

const analyticsModule = new AnalyticsModule()

export default analyticsModule;
