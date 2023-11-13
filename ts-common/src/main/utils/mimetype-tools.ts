/*
 * ts-common is the basic building blocks of our typescript projects
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

export const MimeType_txt = 'text/plain';
export const MimeType_html = 'text/html';
export const MimeType_csv = 'text/csv';

export const MimeType_png = 'image/png';
export const MimeType_jpeg = 'image/jpeg';
export const MimeType_jpg = 'image/jpg';
export const MimeType_gif = 'image/gif';

export const MimeType_pdf = 'application/pdf';
export const MimeType_zip = 'application/zip';
export const MimeType_zip_octetStream = 'application/octet-stream';
export const MimeType_zip_compressed = 'application/x-zip-compressed';
export const MimeType_zip_multipart = 'multipart/x-zip';
export const MimeType_GROUP_zip = [
	MimeType_zip,
	MimeType_zip_octetStream,
	MimeType_zip_compressed,
	MimeType_zip_multipart
];

export const MimeType_rar = 'application/zip';
export const MimeType_rar_compressed = 'application/zip';
export const MimeType_rar_octetStream = 'application/octet-stream';

export const MimeType_GROUP_rar = [
	MimeType_rar,
	MimeType_rar_compressed,
	MimeType_rar_octetStream,
];

