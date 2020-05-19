/*
 * A typescript & react boilerplate with api call example
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

import {
	blueGrey,
	veryLightPink,
	white
} from "@styles/colors";

export const productStyle = {
	container: (provided: any) => ({
		...provided,
		width: 130,
		fontSize: 13,
		border: "none"
	}),
	indicatorSeparator: (provided: any) => ({
		...provided,
		width: 0
	}),
	control: (provided: any) => ({
		...provided,
		border: "none",
		height: 23
	}),
	option: (provided: any, state: any) => ({
		...provided,
		borderBottomColor: veryLightPink,
		borderBottomWidth: 1,
		borderBottomStyle: "solid",
		color: blueGrey,
		fontSize: 13,
		fontWeight: 500,
		backgroundColor: state.isFocused ? veryLightPink : white
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: blueGrey,
		height: 18,
		fontSize: 13,
		fontWeight: 500
	})
};

export const selectStyles = {
	container: (provided: any) => ({
		...provided,
		width: 240,
		fontSize: 13,
		outline: "none"
	}),
	control: () => ({
		border: "1px solid",
		color: blueGrey,
		display: "flex",
		height: 32,
		fontSize: 13,
		outline: "none"
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: blueGrey,
		fontWeight: 500
	}),
	input: (provided: any) => ({
		...provided,
		color: "#fff"
	}),
	option: (provided: any, state: any) => ({
		...provided,
		backgroundColor: "unset",
		color: blueGrey,
		':hover': {
			backgroundColor: veryLightPink
		}
	}),
};
