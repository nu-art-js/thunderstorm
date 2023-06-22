/*
 * Storm contains a list of utility functions.. this project
 * might be broken down into more smaller projects in the future.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by tacb0ss on 09/07/2018.
 */

const cursorValuesIteratorToArray = (errorHandler, cursor, callback) => {
	const array = [];
	cursorValuesIterator(errorHandler, cursor, (dbItem) => {
		if (!dbItem) {
			callback(array);
			return;
		}

		array[array.length] = dbItem;
	})
};

const cursorValuesIterator = (errorHandler, cursor, processor) => {
	let onRejected = errorHandler.onError.bind(errorHandler);
	const callback = (dbItem) => {
		processor(dbItem);
		if (!dbItem)
			return;

		cursor.next().then(callback, onRejected);
	};
	cursor.next().then(callback, onRejected);
};

const findValueInDictionary = (exception, dictionary, value) => {
	const foundValue = Object.keys(dictionary).find((key) => {
		return dictionary[key] === value;
	});

	if (!foundValue)
		throw exception;
};

module.exports = {
	cursorValuesIterator: cursorValuesIterator,
	cursorValuesIteratorToArray: cursorValuesIteratorToArray,
	findValueInDictionary: findValueInDictionary,
};