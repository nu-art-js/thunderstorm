import * as React from "react";
import {_keys, filterInstances, isErrorOfType, ValidationException} from "@nu-art/ts-common";
import ResolveDependencyToast from "./resolve-dependency-toast/ResolveDependencyToast";


const isDependencyError = (e: any): boolean => {
    return (e.errorResponse.error.type === 'has-dependencies');
}

export const generateErrorToast = (e: any, Toast: any, additionalData: any): React.ReactNode => {

    if (isDependencyError(e)) {
        return <Toast iconKey="x"
                      content={<ResolveDependencyToast dependencyConflicts={e.errorResponse.error.body}
                                                       deletedEntity={additionalData}/>}
                      toastType={'error'}/>
    } else if (isErrorOfType(e, ValidationException)) {
        return <Toast iconKey="x" content={`Invalid input for fields: ${filterInstances(_keys(e.result)).join(', ')}`}
                      toastType={'error'}/>
    }
    return <Toast iconKey="x" content={<span>Something went wrong, try again later...</span>} toastType={'error'}/>
}
