import {ModuleFE_FileUpload} from '@nu-art/file-upload-frontend/index';
import * as React from 'react';


export class Example_Uploader_Renderer
	extends React.Component {
	constructor(props: {}) {
		super(props);
	}

	onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files)
			return;

		const results = await ModuleFE_FileUpload.upload(Object.values(files), 'default', true);
		console.log('Upload results:', results);
	};

	render() {
		return <>
			<input type={'file'} onChange={this.onSelect} multiple={true}/>
		</>;
	}
}

export const Example_Uploader = {renderer: Example_Uploader_Renderer, name: 'File Uploader'};
