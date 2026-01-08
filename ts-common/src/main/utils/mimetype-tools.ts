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

/** MIME type constants for common file types */

/** Text/plain MIME type */
export const MimeType_txt = 'text/plain';
/** HTML MIME type */
export const MimeType_html = 'text/html';
/** CSV MIME type */
export const MimeType_csv = 'text/csv';

/** PNG image MIME type */
export const MimeType_png = 'image/png';
/** JPEG image MIME type */
export const MimeType_jpeg = 'image/jpeg';
/** JPG image MIME type */
export const MimeType_jpg = 'image/jpg';
/** GIF image MIME type */
export const MimeType_gif = 'image/gif';

/** PDF MIME type */
export const MimeType_pdf = 'application/pdf';
/** ZIP archive MIME type */
export const MimeType_zip = 'application/zip';
/** Octet stream MIME type (often used for ZIP files) */
export const MimeType_zip_octetStream = 'application/octet-stream';
/** Compressed ZIP MIME type */
export const MimeType_zip_compressed = 'application/x-zip-compressed';
/** Multipart ZIP MIME type */
export const MimeType_zip_multipart = 'multipart/x-zip';
/** Array of all ZIP-related MIME types */
export const MimeType_GROUP_zip = [
	MimeType_zip,
	MimeType_zip_octetStream,
	MimeType_zip_compressed,
	MimeType_zip_multipart
];

/** RAR archive MIME type (note: uses application/zip) */
export const MimeType_rar = 'application/zip';
/** JSON MIME type */
export const MimeType_json = 'application/json';
/** Compressed RAR MIME type */
export const MimeType_rar_compressed = 'application/zip';
/** Octet stream MIME type for RAR files */
export const MimeType_rar_octetStream = 'application/octet-stream';

/** Array of all RAR-related MIME types */
export const MimeType_GROUP_rar = [
	MimeType_rar,
	MimeType_rar_compressed,
	MimeType_rar_octetStream,
];

