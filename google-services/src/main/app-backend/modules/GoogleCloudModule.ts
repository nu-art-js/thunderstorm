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

/**
 * Created by tacb0ss on 07/05/2018.
 */

import {
	__stringify,
	BadImplementationException,
	ImplementationMissingException,
	Module,
	ThisShouldNotHappenException,
	timeout
} from "@nu-art/ts-common";
import {
	cloudresourcemanager_v1,
	cloudresourcemanager_v2,
	serviceusage_v1
} from "googleapis";
import {AuthModule} from "./AuthModule";
import Serviceusage = serviceusage_v1.Serviceusage;
import Cloudresourcemanager = cloudresourcemanager_v2.Cloudresourcemanager;
import CloudresourcemanagerV1 = cloudresourcemanager_v1.Cloudresourcemanager;
import Schema$GoogleApiServiceusageV1Service = serviceusage_v1.Schema$GoogleApiServiceusageV1Service;
import Schema$Folder = cloudresourcemanager_v2.Schema$Folder;
import Schema$Project = cloudresourcemanager_v1.Schema$Project;

type CreateFolder = { parentId: string, folderName: string };
type QueryFolder = { parentId: string, folderName: string };

export enum ServiceKey {
	DialogFlow = "dialogflow.googleapis.com"
}

export class GoogleCloudManager_Class
	extends Module {
	private cloudServicesManagerAPI!: serviceusage_v1.Serviceusage;
	private cloudResourcesManagerAPI!: cloudresourcemanager_v2.Cloudresourcemanager;
	private cloudResourcesManagerAPIv1!: cloudresourcemanager_v1.Cloudresourcemanager;


	protected init() {
		this.cloudServicesManagerAPI = new Serviceusage(AuthModule.getAuth(undefined, 'v1'));
		this.cloudResourcesManagerAPI = new Cloudresourcemanager(AuthModule.getAuth());
		this.cloudResourcesManagerAPIv1 = new CloudresourcemanagerV1(AuthModule.getAuth(undefined, 'v1'));
	}

	// FOLDERS
	async getOrCreateFolder(parentFolderId: string, folderName: string) {
		if (parentFolderId === undefined)
			throw new BadImplementationException("MUST provide a parentFolderId")

		if (folderName === undefined)
			throw new BadImplementationException("MUST provide a folderName")

		const folders = await this.queryFolders({parentId: parentFolderId, folderName});
		let parentFolder;
		if (folders.length > 1)
			throw new ThisShouldNotHappenException("too many folders for query...");
		else if (folders.length === 1)
			parentFolder = folders[0];
		else
			parentFolder = await this.createFolder({parentId: parentFolderId, folderName});

		if (!parentFolder)
			throw new BadImplementationException("MUST be parentFolder")

		return this.getFolderId(parentFolder);
	}

	async createFolder(_request: CreateFolder) {
		const request = {
			parent: `folders/${_request.parentId}`,
			requestBody: {
				displayName: _request.folderName
			}
		};

		this.logInfo(`Creating GCP folder "${_request.parentId}/${_request.folderName}"`);
		const res = await this.cloudResourcesManagerAPI.folders.create(request);
		return await this._waitForFolderOperation(res.data.name as string);
	}

	async queryFolders(_query: QueryFolder) {
		const query = {query: `parent=folders/${_query.parentId} AND displayName=${_query.folderName}`};
		const res = await this.cloudResourcesManagerAPI.folders.search({requestBody: query})

		return res.data.folders || [];
	}

	getFolderId(folder: Schema$Folder) {
		return (folder.name as string).replace("folders/", "");
	}

	private async _waitForFolderOperation(name: string) {
		let retry = 5;
		while (retry >= 0) {
			await timeout(2000);
			const res = await this.cloudResourcesManagerAPI.operations.get({name})
			if (res.data.done)
				return res.data.response;

			retry--;
		}

		throw new ImplementationMissingException("need better handling here..");
	}

	// PROJECTS
	async listProjects(filter: ((project: Schema$Project) => boolean) = () => true) {
		const results = await this.cloudResourcesManagerAPIv1.projects.list();

		const projects: Schema$Project[] = results.data.projects || [];
		return projects.filter(filter);
	}

	async getOrCreateProjects(parentId: string, ...projects: { projectId: string, name: string }[]) {
		const existingProjects = await this.listProjects(gcproject => !!projects.find(project => project.name === gcproject.name));

		const projectsToCreate = projects
			.filter((project) => !existingProjects.find((gcproject) => gcproject.name === project.name));

		const newProjects = await Promise.all(projectsToCreate.map(project => this.createProject(parentId, project.projectId, project.name)));
		const allProjects = [...existingProjects, ...newProjects];
		return projects.map(project => allProjects.find(gcpProject => gcpProject.name === project.name));
	}

	async createProject(parentId: string, projectId: string, name: string) {

		// @ts-ignore
		const options: Schema$Project = {
			projectId,
			name,
			parent: {
				type: "folder",
				id: parentId
			}
		};

		this.logInfo(`Creating GCP Project "${parentId}/${projectId}/${name}"`);
		const response = await this.cloudResourcesManagerAPIv1.projects.create({requestBody: options});
		return this._waitForProjectOperation(response.data.name as string) as Schema$Project
	}

	async _waitForProjectOperation(name: string) {
		let retry = 5;
		while (retry >= 0) {
			await timeout(2000);
			const res = await this.cloudResourcesManagerAPIv1.operations.get({name})
			if (res.data.done)
				return res.data.response;

			retry--;
		}

		throw new ImplementationMissingException("need better handling here..");
	}

	// SERVICES
	async getService(serviceKey: ServiceKey, projectId: string) {
		const res = await this.cloudServicesManagerAPI.services.get({name: `projects/${projectId}/services/${serviceKey}`});
		return res.data;
	}

	async enableService(serviceKey: ServiceKey, enable: boolean, ...projectIds: string[]) {
		this.logInfo(`Enabling Service "${serviceKey}" for projects: ${__stringify(projectIds)}`);
		return Promise.all(projectIds.map(projectId => this._enableService(serviceKey, projectId, enable)))
	}

	// @ts-ignore
	private async _enableService(serviceKey: ServiceKey, projectId: string, enable = true) {
		let service = await this.getService(serviceKey, projectId);
		if (this._isEnabled(service) === enable)
			return this.logVerbose(`Service "${serviceKey}" was already enabled for project: ${projectId}`);

		const name: string = service.name as string;
		let res;
		if (enable)
			res = await this.cloudServicesManagerAPI.services.enable({name});
		else
			res = await this.cloudServicesManagerAPI.services.disable({name});

		service = await this._waitForServiceOperation(res.data.name as string)
		if (this._isEnabled(service))
			this.logVerbose(`Service "${serviceKey}" is now enabled for project: ${projectId}`);
		else
			this.logError(`Service "${serviceKey}" is now disabled for project: ${projectId}`);

		return service;

	}

	private async _waitForServiceOperation(name: string) {
		let retry = 5;
		while (retry >= 0) {
			await timeout(2000);
			const res = await this.cloudServicesManagerAPI.operations.get({name})
			if (res.data.done)
				return res.data.response?.service as Schema$GoogleApiServiceusageV1Service;

			retry--;
		}

		throw new ImplementationMissingException("need better handling here..");
	}

	async isEnabled(serviceKey: ServiceKey, projectId: string) {
		const service = await this.getService(serviceKey, projectId);
		return this._isEnabled(service);
	}

	private _isEnabled(service: Schema$GoogleApiServiceusageV1Service) {
		return service.state === "ENABLED"
	}

}

export const GoogleCloudManager = new GoogleCloudManager_Class();
