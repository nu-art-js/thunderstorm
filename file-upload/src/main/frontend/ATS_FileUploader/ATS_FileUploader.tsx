import * as React from 'react';
import {FirebaseAnalyticsModule} from '@nu-art/firebase/frontend';
import {
	AppToolsScreen, ATS_Fullstack,
	LL_H_T,
	LL_V_L,
	openContent,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent,
	TS_DragAndDrop
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_AssetUploader} from '../modules/ModuleFE_AssetUploader';
import {ModuleFE_Assets} from '../modules/ModuleFE_Assets';


type ATS_FileUploader_Props = {
	//
};
type ATS_FileUploader_State = {
	//
};

export class ATS_FileUploader
	extends SmartComponent<ATS_FileUploader_Props, ATS_FileUploader_State> {

	static screen: AppToolsScreen = {name: `FileUploader`, renderer: this, group: ATS_Fullstack};

	static defaultProps = {
		modules: [ModuleFE_Assets],
		pageTitle: () => this.screen.name
	};

	constructor(p: ATS_FileUploader_Props) {
		super(p);
		// @ts-ignore
		FirebaseAnalyticsModule.setCurrentScreen(this.pageTitle);
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent & ATS_FileUploader_Props, state: (Partial<ATS_FileUploader_State> & State_SmartComponent)) {
		return state;
	}

	render() {

		return <LL_H_T>
			<LL_V_L>
				{ModuleFE_Assets.cache.all().map(asset => <div key={asset._id} {...openContent.tooltip.bottom(`${asset._id}-tooltip`, () => {
					return <LL_V_L>{asset.bucketName}/{asset.path}</LL_V_L>;
				}, {offset: 10})}>{asset.name}</div>)}
			</LL_V_L>
			<LL_V_L>
				Drag and Drop files bellow
				<TS_DragAndDrop
					validate={files => {
						return files.map(file => ({file, accepted: true}));
					}}
					onChange={acceptedFiles => {
						return ModuleFE_AssetUploader.upload(acceptedFiles, 'test');
					}}/>
			</LL_V_L>
		</LL_H_T>;
	}
}