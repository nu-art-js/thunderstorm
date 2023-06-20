/*
 * Live-Docs will allow you to add and edit tool-tips from within your app...
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

// import * as React from 'react';
import {ToastBuilder} from '@nu-art/thunderstorm/frontend';
import {LiveDocActionResolver} from './modules/ModuleFE_LiveDocs';
import {DB_Document} from '../shared/types';


export const DefaultLiveDocEditor: LiveDocActionResolver = (doc: DB_Document) => {

	return new ToastBuilder().setContent(doc.document.length === 0 ? `No Content for document with key: ${doc.document}` : doc.document);
	// .setActions(
	// 	[<button style={{marginRight: 8}} onClick={() => showEditModalExample(docKey)}>Edit</button>]);
};

export const showEditModalExample = (docKey: string) => {
	// const title = "Default Edit modal";
	//
	// const doc = LiveDocsModule.get(docKey);
	//
	// const originalDoc = doc.document;
	// const content = <TS_TextArea id={`livedoc-${docKey}`} type="text" style={{height: "110px", margin: "8px", width: "100%", outline: "none"}}
	//                              value={doc.document}
	//                              onChange={(value: string) => {
	// 	                             doc.document = value;
	// 	                             ModuleFE_Toaster.toastInfo(doc.document);
	//                              }}/>;

	// new Dialog_Builder(content)
	// 	.setTitle(title)
	// 	.setStyle({maxWidth: "400px", width: "350px", height: "220px"})
	// 	.addButton(DialogButton_Cancel(() => {
	// 		doc.document = originalDoc;
	// 		ModuleFE_Dialog.close();
	// 	}))
	// 	.addButton(DialogButton_Save(() => {
	// 		const liveDoc: Request_UpdateDocument = {key: docKey, document: doc.document};
	// 		LiveDocsModule.update(liveDoc);
	// 		ModuleFE_Dialog.close();
	// 	}))
	// 	.setOverlayColor("rgba(102, 255, 255, 0.4)")
	// 	.show();
};
