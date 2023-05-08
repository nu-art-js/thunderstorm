import * as React from 'react';
import {_keys, filterInstances, isErrorOfType, ValidationException} from '@nu-art/ts-common';
import ResolveDependencyToast from './resolve-dependency-toast/ResolveDependencyToast';


const isDependencyError = (e: any): boolean => {
	return (e.errorResponse?.error.type === 'has-dependencies');
};

export const generateErrorToastContent = (e: any, content: React.ReactNode, additionalData: any): React.ReactNode => {

	if (isDependencyError(e))
		return <ResolveDependencyToast dependencyConflicts={e.errorResponse.error.body} deletedEntity={additionalData}/>;

	if (isErrorOfType(e, ValidationException))
		return <div>{`Invalid input for fields: ${filterInstances(_keys(e.result)).join(', ')}`}</div>;

	return <div>Something went wrong, try again later...</div>;
};
