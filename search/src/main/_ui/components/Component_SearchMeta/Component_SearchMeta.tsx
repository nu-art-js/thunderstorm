import * as React from 'react';
import {ComponentSync, LL_H_C} from '@nu-art/thunder-widgets';
import {stopPropagation} from '@nu-art/thunder-core';
import './Component_SearchMeta.scss';
import {filterInstances, formatTimestamp, TypedMap} from '@nu-art/ts-common';
import {downloadFile, objectsToCsvString} from '../../utils/csv-and-download.js';
import {SearchContext, SearchResultsRenderer} from '../../../_core/SearchContext.js';
import {SearchItem} from '../../../_core/SearchItem.js';

type Props = {
	context: SearchContext;
};

export class Component_SearchMeta
	extends ComponentSync<Props>
	implements SearchResultsRenderer {

	__onSearchResultsChanged = () => {
		this.forceUpdate();
	};

	override componentDidMount() {
		this.props.context.searchResultChangeListeners.register(this);
	}

	override componentWillUnmount() {
		this.props.context.searchResultChangeListeners.unregister(this);
	}

	private printResults = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!e.metaKey)
			return;
		stopPropagation(e);
		this.logInfo('SearchResults', this.props.context.getSearchResults());
	};

	private exportResults = (e: React.MouseEvent<HTMLDivElement>) => {
		const results = this.props.context.getSearchResults();
		if (!results?.length)
			return;
		stopPropagation(e);
		const searchItemMap = this.props.context.getActiveSearchItems().reduce((map, searchItem) => {
			map[searchItem.module.config.dbKey] = searchItem;
			return map;
		}, {} as TypedMap<SearchItem<any, any>>);

		const objects = filterInstances(results.map(result => {
			const searchItem = searchItemMap[result.dbKey];
			if (!searchItem)
				return;
			return {
				collection: result.dbKey,
				id: result.id,
				label: searchItem.labelResolver(result),
			};
		}));
		const str = objectsToCsvString(objects, ['collection', 'id', 'label']);
		const fileName = `Search Results - [${formatTimestamp('DD/MM/YYYY-HH:mm:ss')}]`;
		downloadFile({fileName, content: str, mimeType: 'text/csv'});
	};

	override render() {
		const searchResults = this.props.context.getSearchResults();
		if (!searchResults?.length)
			return;

		return <LL_H_C className={'c__search-meta'} onClick={this.printResults}>
			<div className={'c__search-meta__results'} onClick={this.exportResults}>{searchResults.length} Results</div>
			{this.renderTime()}
		</LL_H_C>;
	}

	private renderTime = () => {
		const searchTime = this.props.context.getSearchTime();
		if (!searchTime)
			return;
		const str = searchTime >= 1000 ? `${searchTime / 1000}s` : `${searchTime}ms`;
		return <div className={'c__search-meta__time'}>{str}</div>;
	};
}
