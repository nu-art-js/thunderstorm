import {DBEntityDependencies, DBEntityDependencyErrorType} from '@nu-art/thunderstorm';
import {ModuleFE_XHR} from '@nu-art/thunderstorm/frontend';
import {Module} from '@nu-art/ts-common';
import {dispatch_ShowConflictResolution} from '../_ui/Overlay_ConflictResolution/dispatcher';

class ModuleFE_ConflictResolution_Class
	extends Module {

	public initDefaultHasDependencyResponse = () => {
		ModuleFE_XHR.setDefaultOnError(async (errorResponse, input, request) => {
			if (errorResponse.errorResponse?.error?.type === DBEntityDependencyErrorType) {
				dispatch_ShowConflictResolution.dispatchUI(errorResponse.errorResponse.error.data);
			}
		});
	};

	public showDependencies = (dependencies: DBEntityDependencies) => {
		dispatch_ShowConflictResolution.dispatchUI(dependencies);
	};
}

export const ModuleFE_ConflictResolution = new ModuleFE_ConflictResolution_Class();