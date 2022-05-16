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

import {UploaderModuleFE} from '@nu-art/file-upload/frontend';
import * as React from 'react';


export class Example_Uploader_Renderer
	extends React.Component {
	constructor(props: {}) {
		super(props);

	}

	onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		files && UploaderModuleFE.upload(Object.values(files), 'default', true);
	};

	render() {
		return <>
			<input type={'file'} onChange={this.onSelect} multiple={true}/>
		</>;
	}
}

export const Example_Uploader = {renderer: Example_Uploader_Renderer, name: 'File Uploader'};