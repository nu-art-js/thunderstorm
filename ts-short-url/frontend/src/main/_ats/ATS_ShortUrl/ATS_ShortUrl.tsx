import './ATS_ShortUrl.scss';
import { AppToolsScreen, ATS_Fullstack, Button, ComponentSync, LL_H_C, LL_V_L, TS_AppTools } from "@nu-art/thunder-routing/index";
import { DispatcherType_ShortUrl, ModuleFE_ShortUrl } from '../../_entity/short-url/index.js';
import { Component_ShortUrlEditor } from './components/Component_ShortUrlEditor.js';
import { sortArray, voidFunction } from '@nu-art/ts-common';
import { TS_EditableItemController } from '@nu-art/thunderstorm-frontend/components/TS_EditableItemController/index';
import { ApiCallerEventType, DispatcherInterface } from '@nu-art/thunder-db-api-frontend';
import { DB_ShortUrl, DBProto_ShortUrl } from '@nu-art/ts-short-url-shared';
type State = {};
type Props = {};
export class ATS_ShortUrl extends ComponentSync<Props, State> implements DispatcherInterface<DispatcherType_ShortUrl> {
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
        const allMutable = ModuleFE_ShortUrl.cache.allMutable();
        return <div className={'short-url'}>
			<LL_H_C className={'page-title'}>
				{TS_AppTools.renderPageHeader('Manage App Short Urls')}
				<Button variant={'primary'} onClick={voidFunction}>Add Short Url</Button>
			</LL_H_C>
			<LL_V_L className={'url-cards'}>
				<Card_ShortUrl key={`new-short-url-${allMutable.length}`}/>
				{sortArray(allMutable, (item: DB_ShortUrl) => item.title + item._shortUrl)
                .map((shortUrl: DB_ShortUrl) => <Card_ShortUrl editorProps={{ deleteCallback: () => this.forceUpdate() }} key={shortUrl._id} item={shortUrl}/>)}
			</LL_V_L>
		</div>;
    }
}
class Card_ShortUrl extends TS_EditableItemController<DBProto_ShortUrl, {
    deleteCallback: VoidFunction;
}> {
    static defaultProps = {
        module: ModuleFE_ShortUrl,
        editor: Component_ShortUrlEditor,
        createInitialInstance: () => ({})
    };
}
