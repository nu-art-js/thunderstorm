import {CustomException} from '@nu-art/ts-common';


export class EntityNotFoundException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(EntityNotFoundException, message, cause);
	}
}

export class EntityOutdatedException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(EntityOutdatedException, message, cause);
	}
}

export class InvalidEntityVersionException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(InvalidEntityVersionException, message, cause);
	}
}
