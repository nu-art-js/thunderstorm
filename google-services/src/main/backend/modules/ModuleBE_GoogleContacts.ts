/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import {people_v1} from 'googleapis';
import {ModuleBE_Auth} from './ModuleBE_Auth';


export const standardProperties = [
	'addresses',
	'birthdays',
	'emailAddresses',
	'genders',
	'names',
	'phoneNumbers',
	'userDefined'
];

export const standardPhotoProperties = [
	'addresses',
	'birthdays',
	'emailAddresses',
	'genders',
	'names',
	'phoneNumbers',
	'userDefined',
	'photos'
];

export type GoogleContact = people_v1.Schema$Person
type Config = {
	authKey?: string
}

export class ModuleBE_GoogleContacts_Class
	extends Module<Config> {

	constructor() {
		super('ModuleBE_GoogleContacts');
	}

	protected init(): void {
	}

	public getContactById = async (userEmail: string, contactId: string, authKey?: string) => {
		const query = {
			resourceName: contactId,
			personFields: `${standardProperties.join(',')},metadata`
		};
		return (await this.createContactApi(userEmail, authKey).people.get(query)).data;
	};

	public delete = async (userEmail: string, resource: string, authKey?: string) => {
		const contactsApi = await this.createContactApi(userEmail, authKey);
		return (await contactsApi.people.deleteContact({resourceName: resource})).data;
	};

	public list = async (userEmail: string, pageToken?: string, authKey?: string) => {
		const query: people_v1.Params$Resource$People$Connections$List = {
			// Only valid resourceName according to https://developers.google.com/people/api/restv1/people.connections/list
			pageToken,
			resourceName: 'people/me',
			pageSize: 1000,
			personFields: standardProperties.join(',')
		};
		return (await this.createContactApi(userEmail, authKey).people.connections.list(query)).data;
	};

	public create = async (userEmail: string, record: GoogleContact, authKey?: string) => {
		return (await this.createContactApi(userEmail, authKey).people.createContact({requestBody: record})).data;
	};

	public update = async (userEmail: string, record: GoogleContact, authKey?: string) => {
		const updateRequest = {
			resourceName: record.resourceName!,
			updatePersonFields: standardProperties.join(','),
			requestBody: record
		};

		return (await this.createContactApi(userEmail, authKey).people.updateContact(updateRequest)).data;
	};

	public updatePhoto = async (userEmail: string, person: GoogleContact, contactImageBase64: string, authKey?: string) => {
		const updatePhoto = {
			resourceName: person.resourceName!,
			requestBody: {
				photoBytes: contactImageBase64,
				personFields: standardPhotoProperties.join(',')
			}
		};

		return (await this.createContactApi(userEmail, authKey).people.updateContactPhoto(updatePhoto)).data;
	};

	private createContactApi = (userEmail: string, authKey?: string) => {
		const finalAuthKey = authKey || this.config.authKey;
		if (!finalAuthKey)
			throw new ImplementationMissingException('missing authkey for google contacts api');

		const auth = ModuleBE_Auth.getAuth(finalAuthKey, ['https://www.googleapis.com/auth/contacts'], 'v1', {subject: userEmail});
		return new people_v1.People(auth);
	};
}

export const ModuleBE_GoogleContacts = new ModuleBE_GoogleContacts_Class();