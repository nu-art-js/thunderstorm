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

import * as React from "react";
import { UploaderModule } from "@nu-art/file-upload/frontend";


export class Example_Uploader
	extends React.Component {
	constructor(props: {}) {
		super(props);

	}

	onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			Object.keys(files).forEach((key: string) => {
				// @ts-ignore
				const file = files[key];
				UploaderModule.upload(file);
			})
		}
	};


	render() {
		return <>
			<input type={'file'} onChange={this.onSelect}/>
		</>;
	}
}
