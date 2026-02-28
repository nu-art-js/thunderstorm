import {FirebaseAnalyticsModule} from '@nu-art/firebase-frontend';
import {AppToolsScreen, ATS_Fullstack} from '@nu-art/thunder-ui-modules';
import {ComponentSync, LL_H_C, LL_H_T, LL_V_L} from '@nu-art/thunder-widgets';
import {ModuleFE_AssetUploader} from '../modules/ModuleFE_AssetUploader.js';
import {ModuleFE_Assets} from '../modules/ModuleFE_Assets.js';
import {ResolvableContent, resolveContent, sortArray} from '@nu-art/ts-common';

type Props = {
	pageTitle?: ResolvableContent<string>;
};

type State = Record<string, never>;

export class ATS_FileUploader
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {
		name: `File Uploader`,
		renderer: this,
		group: ATS_Fullstack,
		modulesToAwait: [ModuleFE_Assets],
	};

	static defaultProps: Partial<Props> = {
		pageTitle: () => this.screen.name,
	};

	constructor(p: Props) {
		super(p);
		// @ts-ignore
		FirebaseAnalyticsModule.setCurrentScreen(resolveContent(this.props.pageTitle));
	}

	render() {
		return <LL_H_T>
			<LL_V_L>
				{sortArray([...ModuleFE_Assets.cache.all()], (asset: { __updated?: number }) => asset.__updated).map((asset: { _id: string; name: string; bucketName?: string; path?: string }) => (
					<LL_H_C key={asset._id} className="clickable h-gap__n" title={`${asset.bucketName ?? ''}/${asset.path ?? ''}`}>
						{asset.name}
					</LL_H_C>
				))}
			</LL_V_L>
			<div style={{width: 400, height: 302}}>
				<input
					type="file"
					multiple
					onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
						const files = ev.target.files;
						if (files?.length)
							ModuleFE_AssetUploader.upload(Array.from(files), 'test-upload');
					}}
				/>
			</div>
		</LL_H_T>;
	}
}
