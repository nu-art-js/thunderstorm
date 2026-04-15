import './ATS_ShortUrl.scss';
import {TS_EditableItemController} from '@nu-art/editable-item';
import {AppToolsScreen, ATS_Fullstack, TS_AppTools} from '@nu-art/thunder-ui-modules';
import {Button, ComponentSync, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import {ModuleFE_ShortUrl} from '../../_entity/short-url/ModuleFE_ShortUrl.js';
import {Component_ShortUrlEditor} from './components/Component_ShortUrlEditor.js';
import {sortArray, voidFunction} from '@nu-art/ts-common';
import {DB_ShortUrl} from '@nu-art/ts-short-url-shared';
import {DispatcherInterface} from '@nu-art/db-api-shared';


type State = {};

type Props = {}

export class ATS_ShortUrl
	extends ComponentSync<Props, State>
	implements DispatcherInterface<any> {

	static screen: AppToolsScreen = {
		name: 'Short Url',
		key: 'short-url',
		renderer: this,
		modulesToAwait: [ModuleFE_ShortUrl as any],
		group: ATS_Fullstack
	};

	__onShortUrlsUpdated(...params: any) {
		this.forceUpdate();
	}

	render() {
		const allMutable = (ModuleFE_ShortUrl as { cache: { allMutable: () => DB_ShortUrl[] } }).cache.allMutable();
		return <div className={'short-url'}>
			<LL_H_C className={'page-title'}>
				{TS_AppTools.renderPageHeader('Manage App Short Urls')}
				<Button variant={'primary'} onClick={voidFunction}>Add Short Url</Button>
			</LL_H_C>
			<LL_V_L className={'url-cards'}>
				<Card_ShortUrl key={`new-short-url-${allMutable.length}`}/>
				{sortArray(allMutable, (item: DB_ShortUrl) => item.title + item._shortUrl)
					.map((shortUrl: DB_ShortUrl) => <Card_ShortUrl editorProps={{deleteCallback: () => this.forceUpdate()}}
																												 key={shortUrl._id} item={shortUrl}/>)}
			</LL_V_L>
		</div>;
	}
}

class Card_ShortUrl
	extends TS_EditableItemController<any, { deleteCallback: VoidFunction }> {

	static defaultProps = {
		module: ModuleFE_ShortUrl as any,
		editor: Component_ShortUrlEditor,
		createInitialInstance: () => ({})
	};
}
