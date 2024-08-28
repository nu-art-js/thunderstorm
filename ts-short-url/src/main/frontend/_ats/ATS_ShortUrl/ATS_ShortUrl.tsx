import * as React from 'react';
import './ATS_ShortUrl.scss';
import {
	AppToolsScreen,
	ATS_Fullstack,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	TS_AppTools,
	TS_Button
} from '@thunder-storm/core/frontend';
import {DispatcherType_ShortUrl, ModuleFE_ShortUrl} from '../../../_entity/short-url/frontend';
import {DBProto_ShortUrl} from '../../../_entity/short-url/shared';
import {Component_ShortUrlEditor} from './components/Component_ShortUrlEditor';
import {sortArray, voidFunction} from '@thunder-storm/common';
import {TS_EditableItemController} from '@thunder-storm/core/frontend/components/TS_EditableItemController';
import {ApiCallerEventType, DispatcherInterface} from '@thunder-storm/core/frontend/core/db-api-gen/types';


type State = {};

type Props = {}

export class ATS_ShortUrl
	extends ComponentSync<Props, State> implements DispatcherInterface<DispatcherType_ShortUrl> {

	static screen: AppToolsScreen = {
		name: 'Short Url',
		key: 'short-url',
		renderer: this,
		modulesToAwait: [ModuleFE_ShortUrl],
		group: ATS_Fullstack
	};

	__onShortUrlsUpdated(...params: ApiCallerEventType<DBProto_ShortUrl>) {
		this.forceUpdate();
	}

	render() {
		return <div className={'short-url'}>
			<LL_H_C className={'page-title'}>
				{TS_AppTools.renderPageHeader('Manage App Short Urls')}
				<TS_Button onClick={voidFunction}>Add Short Url</TS_Button>
			</LL_H_C>
			<LL_V_L className={'url-cards'}>
				<Card_ShortUrl key={`new-short-url-${ModuleFE_ShortUrl.cache.allMutable().length}`}/>
				{sortArray(ModuleFE_ShortUrl.cache.allMutable(), item => item.__created)
					.map(shortUrl => <Card_ShortUrl editorProps={{deleteCallback: () => this.forceUpdate()}}
													key={shortUrl._id} item={shortUrl}/>)}
			</LL_V_L>
		</div>;
	}
}

class Card_ShortUrl
	extends TS_EditableItemController<DBProto_ShortUrl, { deleteCallback: VoidFunction }> {

	static defaultProps = {
		module: ModuleFE_ShortUrl,
		editor: Component_ShortUrlEditor,
		createInitialInstance: () => ({})
	};
}
