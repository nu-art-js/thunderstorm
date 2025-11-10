import * as React from 'react';
import {SearchAddOn, SearchAddOnDef} from '../../_core';
import {TS_Input} from '@nu-art/thunderstorm/frontend';

type AddOnDef_SearchTerm = SearchAddOnDef<'searchTerm', string, 'getSearchTerm', string>;

export const AddOn_SearchTerm: SearchAddOn<AddOnDef_SearchTerm> = {
	renderer: (onChangeCallback) => <TS_Input type={'text'} onChange={val => onChangeCallback('searchTerm', val)}/>
};

type AddOnDef_SearchTerms = SearchAddOnDef<'searchTerms', string, 'getSearchTerms', string[]>

export const AddOn_SearchTerms: SearchAddOn<AddOnDef_SearchTerms> = {
	renderer: (onChangeCallback) => <TS_Input type={'text'} onChange={val => onChangeCallback('searchTerms', val)}/>
};