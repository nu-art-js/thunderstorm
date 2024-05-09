import * as React from 'react';
import {FirebaseAnalyticsModule} from '@nu-art/firebase/frontend';
// import {TS_Icons} from '@nu-art/ts-styles';
import {
	AppToolsScreen,
	ATS_Fullstack, ComponentSync,
	LL_H_C,
	LL_H_T,
	LL_V_L,
	openContent,
	TS_DragAndDrop
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_AssetUploader} from '../modules/ModuleFE_AssetUploader';
import {ModuleFE_Assets} from '../modules/ModuleFE_Assets';
import {ResolvableContent, resolveContent, sortArray} from '@nu-art/ts-common';


type Props = {
	pageTitle?: ResolvableContent<string>
};

type State = {};

export class ATS_FileUploader
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {
		name: `File Uploader`,
		renderer: this,
		group: ATS_Fullstack,
		modulesToAwait: [ModuleFE_Assets],
	};

	static defaultProps: Partial<Props> = {
		pageTitle: () => this.screen.name
	};

	constructor(p: Props) {
		super(p);
		// @ts-ignore
		FirebaseAnalyticsModule.setCurrentScreen(resolveContent(this.props.pageTitle));
	}

	render() {
		return <LL_H_T>§
			<LL_V_L>
				{sortArray([...ModuleFE_Assets.cache.all()], asset => asset.__updated).map(asset => {
					const tooltip = openContent.tooltip.bottom(`${asset._id}-tooltip`, () => {
						return <LL_V_L>{asset.bucketName}/{asset.path}</LL_V_L>;
					}, {offset: 10});
					return <LL_H_C key={asset._id} className="clickable h-gap__n" {...tooltip}>
						{/*						<TS_Icons.download.component style={{width: 18}} onClick={async () => {
							const signedUrl = await ModuleFE_Assets.resolveValidSignedUrl(asset._id);
							const toDownload = {
								fileName: asset.name,
								url: signedUrl,
								mimeType: asset.mimeType
							};

							this.logInfo('Downloading: ', toDownload);
							ModuleFE_Thunderstorm.downloadFile(toDownload);
						}}/>
						<TS_Icons.bin.component style={{width: 18}} onClick={async () => {
							{
								TS_SimpleDialog.show({
									title: `Delete asset`, body: <div>{`Delete '${asset.name}'`}<br/>{`Are you sure `}
									</div>, action: async () => {
										await ModuleFE_Assets.v1.delete({_id: asset._id}).executeSync();
										ModuleFE_Dialog.close()
									}
								});
							}
						}}/>*/}
						{asset.name}</LL_H_C>;

				})}
			</LL_V_L>
			<div style={{width: 400, height: 302}}>
				<TS_DragAndDrop
					validate={files => {
						return files.map(file => ({file, accepted: true}));
					}}
					onChange={acceptedFiles => {
						return ModuleFE_AssetUploader.upload(acceptedFiles, 'test-upload');
					}}/>
			</div>
		</LL_H_T>;
	}
}
