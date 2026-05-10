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

import {randomBytes} from 'crypto';

/**
 * Generates a cryptographically secure random hexadecimal string.
 *
 * Uses `crypto.randomBytes()` for secure random generation. The length may be
 * slightly longer than requested if an odd length is specified (due to hex
 * encoding), so the result is sliced to the exact length.
 *
 * @param length - Desired length of hex string
 * @returns Lowercase hexadecimal string of the specified length
 */
export function generateHex(length: number) {
	return randomBytes(Math.ceil(length / 2))
		.toString('hex')
		.slice(0, length).toLowerCase();
}

/**
 * Generates a UUID v4 (random UUID).
 *
 * **Security Warning**: Uses `Math.random()` which is not cryptographically secure.
 * For security-sensitive use cases, use a library that generates cryptographically
 * secure UUIDs (e.g., `crypto.randomUUID()` in Node.js 14.17+).
 *
 * @returns UUID string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0,
					v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * Generates an 8-character string suitable for short URL usage.
 *
 * Uses cryptographically secure random bytes to generate a URL-safe identifier.
 * Character set includes alphanumeric characters plus dash and underscore.
 *
 * @returns 8-character string for short URL
 */
export function generateShortURL(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	let result = '';
	const random = randomBytes(8); // Generate 8 random bytes

	for (let i = 0; i < 8; i++) {
		const byte = random[i];
		result += chars.charAt(byte % chars.length);
	}

	return result;
}

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur at mi sapien. Proin viverra massa turpis, quis vehicula nibh maximus eu. Integer mi ante, fermentum id rutrum et, condimentum sed quam. Mauris tristique scelerisque nibh eget dignissim. Nulla blandit leo sit amet sem dignissim cursus. Nulla malesuada imperdiet purus, eget dignissim ex elementum eget. Suspendisse consequat lorem eget mauris suscipit congue. Suspendisse potenti. Suspendisse rutrum ligula non ipsum posuere sollicitudin. Morbi iaculis, mauris mollis aliquet convallis, tortor nulla luctus elit, nec pretium eros risus eu sapien. Phasellus congue nunc arcu, vitae vehicula dolor tincidunt vel. Suspendisse a quam diam.\n\n' +
	'Mauris a maximus libero. Ut blandit, leo in mollis condimentum, tortor massa bibendum est, ac porttitor neque felis tempus magna. Proin at nulla quis turpis laoreet posuere. Aenean at nunc nec sapien maximus viverra sed at tellus. Phasellus condimentum, leo at aliquam elementum, metus libero aliquet mi, in rutrum mauris odio ut nisl. Vivamus dignissim elit semper libero elementum, id tristique turpis eleifend. Phasellus quis erat tincidunt, luctus eros ac, vestibulum ante. Vestibulum non erat libero. Sed a risus vel enim lobortis commodo. Fusce viverra diam et nulla fermentum, vel consectetur ante accumsan. Duis lorem mi, ornare eget erat vel, ultricies finibus enim. Vivamus eget tortor sit amet nisi feugiat porta. Aliquam ullamcorper, ex non placerat euismod, sapien augue pellentesque ante, nec ullamcorper magna est a lacus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas et purus nunc. Pellentesque vel ante neque.\n\n' +
	'Cras rutrum a lectus sit amet ultrices. Sed a enim dolor. Cras condimentum semper ex, in cursus dui fringilla et. Sed fringilla semper luctus. Praesent vel molestie dui. Nullam efficitur nec ligula id auctor. Integer vitae semper erat, quis sollicitudin arcu. Nulla tellus tortor, imperdiet sit amet facilisis gravida, porttitor ut massa. Duis egestas imperdiet felis vel dapibus. Maecenas vulputate tempus orci non accumsan.\n\n' +
	'Integer diam ex, consequat et leo a, sagittis dignissim ante. Integer massa massa, dapibus at urna quis, vehicula facilisis mauris. Phasellus blandit neque enim. Suspendisse a lobortis sapien. Phasellus eget tellus fermentum, vestibulum nunc non, finibus sem. Aliquam sollicitudin risus non maximus pellentesque. Praesent mollis nisl vitae velit sodales vulputate. Cras vel quam quis ipsum rutrum luctus eu vel erat. Aenean efficitur viverra sapien vitae faucibus. Cras pretium ante ultrices ex varius accumsan. Nullam metus ante, dignissim ac justo in, condimentum sodales nibh. Nulla convallis justo laoreet massa vestibulum, consequat maximus risus suscipit. Proin ultrices elit velit, id tempor neque luctus in. Curabitur gravida ac ipsum sed efficitur. Ut accumsan ex dui, eget accumsan sem commodo vel.\n\n' +
	'Proin nulla nisi, ullamcorper in mollis vel, malesuada at orci. Mauris vel enim pharetra, auctor mauris in, malesuada nulla. Nulla eu velit mauris. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin arcu sem, lacinia sit amet nibh interdum, aliquam sagittis est. Vivamus sed ex sed ligula tempor luctus id ut sapien. In tincidunt aliquet dolor nec placerat. Suspendisse non sodales sem, vitae convallis nisl. In id malesuada neque, ac lacinia nulla. Proin ultrices libero at tortor facilisis, eget dapibus dui imperdiet. Praesent vitae ullamcorper dolor. Morbi fringilla condimentum dolor, porttitor gravida leo condimentum at. Nam id diam vel sem dapibus vulputate. Proin ipsum enim, venenatis id mattis a, tincidunt a dolor. Ut risus ex, molestie ac ante non, accumsan laoreet felis.\n\n' +
	'Cras vehicula velit sit amet varius ultrices. Sed rutrum ornare dolor. Maecenas ut nisl erat. Morbi molestie nulla eu massa dictum sagittis. Curabitur eu ipsum dolor. Phasellus at tristique ipsum. Fusce a maximus nunc. Nullam a maximus dolor, in vulputate mi.\n\n' +
	'Ut et ligula ultricies, consectetur felis in, maximus libero. Quisque suscipit fringilla quam eu blandit. In ac ornare velit. Integer in pretium ligula. Nunc egestas id augue ac pharetra. Curabitur vel lorem semper, lacinia mi nec, rhoncus augue. Proin efficitur, quam ac tempus aliquam, augue mauris sagittis dui, eu bibendum dui dui sit amet nisi. Nullam mattis, erat nec pellentesque eleifend, risus dui dapibus nulla, ac efficitur eros libero sed ex. Duis venenatis blandit consectetur. Integer vulputate sem in quam ornare suscipit. Maecenas maximus ullamcorper posuere. Phasellus eleifend auctor dui eget luctus. Ut eleifend felis mauris, vitae congue dui accumsan vitae.\n\n' +
	'Sed lobortis mollis purus, sed egestas orci tincidunt nec. Nunc vel varius nisl. Mauris molestie nibh et commodo pharetra. Pellentesque et ante nisi. Mauris id massa et enim tristique commodo eu in orci. In volutpat augue a nisl elementum mollis. Donec ex dui, bibendum vitae maximus non, lobortis ut odio. Suspendisse nulla massa, tincidunt in lacinia ornare, faucibus eu magna. Vestibulum sollicitudin, ex ultrices consectetur maximus, enim tellus facilisis sapien, a molestie orci ex non tortor. Morbi sit amet vulputate eros. Maecenas tempor orci at ligula interdum cursus.\n\n' +
	'Praesent feugiat convallis rhoncus. Proin tristique eleifend dolor, sit amet tincidunt turpis tincidunt sed. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus luctus iaculis velit vel rutrum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vivamus risus nunc, varius non nunc sit amet, tincidunt convallis lacus. Mauris non lectus vitae libero imperdiet fermentum. In pellentesque dui at elit hendrerit, a sodales justo posuere. Ut rutrum lacus vitae egestas porttitor.\n\n' +
	'Phasellus viverra condimentum tortor quis volutpat. Aenean lobortis vulputate libero non cursus. Vestibulum tincidunt condimentum ante eget tincidunt. Curabitur vel nunc id lacus efficitur feugiat. Aliquam a molestie quam, tempor varius ligula. Mauris lobortis nulla vel elit rhoncus, a varius sapien bibendum. Aenean in euismod metus. Fusce hendrerit mattis pellentesque. Aliquam erat volutpat. Nunc felis nisi, laoreet in dignissim sed, iaculis ut massa. Mauris varius mi nisi. Curabitur eu ante pulvinar, blandit arcu vitae, accumsan elit. In sit amet est tincidunt, laoreet nunc eu, facilisis nibh. Nullam molestie, turpis in lobortis molestie, sapien justo tincidunt velit, et viverra dui nibh vitae quam. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.\n\n' +
	'Morbi vitae condimentum urna, sit amet mattis felis. Nam bibendum ante quis mi luctus viverra sit amet et eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis viverra leo nec justo vehicula, eu aliquam metus elementum. Ut ullamcorper libero ut ex hendrerit, ut ullamcorper sem venenatis. Etiam aliquam quam ac rhoncus facilisis. Integer et ligula bibendum, luctus arcu nec, congue diam. Donec fringilla augue eu molestie elementum. Duis consequat velit dolor, in elementum urna imperdiet a.\n\n' +
	'Aliquam bibendum ipsum magna, at aliquam nisi ornare congue. Cras mollis libero justo, eget mattis velit commodo non. Nam sollicitudin dapibus feugiat. Integer condimentum odio vitae volutpat laoreet. Duis et odio diam. Sed ullamcorper eleifend erat. Duis magna odio, volutpat eu rhoncus vitae, malesuada id sem. Pellentesque ullamcorper libero nisl, eget vehicula orci iaculis sed.\n\n' +
	'Proin dolor quam, fermentum in sem vel, elementum convallis nibh. Quisque vitae eros eu risus euismod accumsan quis non dui. Praesent vestibulum, ex ut pharetra tincidunt, neque sem sagittis nisl, ut iaculis justo mi non diam. Pellentesque eu elit id ante aliquet ullamcorper. Maecenas posuere, quam non aliquam finibus, metus neque maximus nibh, sed sodales est odio nec leo. Donec at leo dictum, condimentum odio eleifend, sollicitudin enim. Sed suscipit auctor sagittis. Proin eu efficitur dolor, nec vestibulum odio. In egestas sollicitudin semper.\n\n' +
	'Fusce a sapien at dui commodo fermentum eget sed tortor. Sed eu fringilla ipsum. Nulla nec dictum neque. Vivamus sed tempor libero. Pellentesque eget eleifend ante, eu posuere erat. Donec placerat turpis a nisi congue, in convallis tellus feugiat. Aliquam hendrerit vulputate nunc, in dictum augue ultrices id. Cras facilisis sapien sit amet dignissim efficitur. Donec a est sit amet ante tempor sodales. Donec aliquam odio dui, quis aliquet nulla placerat dapibus. Donec porttitor est ut dolor bibendum consequat. Duis maximus tortor velit.\n\n' +
	'Maecenas ut elit sem. Maecenas at arcu id augue laoreet mollis id a turpis. Nullam iaculis facilisis quam, nec auctor metus volutpat sit amet. Maecenas quis feugiat tortor. Nam malesuada placerat cursus. Duis sed augue et risus viverra fermentum vel quis nunc. Nulla dignissim, ante eu luctus viverra, lorem elit ultricies tellus, in consectetur turpis est vel nulla. Sed pulvinar laoreet mi quis varius. Nulla fermentum, dui ac dictum scelerisque, libero mi semper tellus, vel volutpat ante diam et urna. Etiam feugiat nisi id risus imperdiet ullamcorper. Morbi eget fermentum ipsum. Mauris mi nunc, interdum eget ante et, pharetra aliquam eros. Donec at porttitor mauris. Etiam euismod libero vitae nibh convallis tristique.\n\n' +
	'Quisque congue nulla eros. Vestibulum maximus erat ac turpis viverra, id tincidunt elit hendrerit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque laoreet augue ut dolor aliquet elementum. In bibendum in mauris sit amet volutpat. Etiam vulputate lectus et ultrices faucibus. Pellentesque est massa, vestibulum at malesuada et, dignissim ac sem. Donec a lacus lacinia, sollicitudin leo id, tristique tortor. Morbi pellentesque enim non arcu lobortis, et rhoncus nibh euismod. Ut faucibus, nulla vestibulum porta egestas, sem ante molestie libero, ac fermentum augue turpis at ipsum. Nullam fermentum turpis vel malesuada rhoncus. Vestibulum eget nisl maximus, tempus mauris et, vestibulum magna.\n\n' +
	'Fusce bibendum metus vel libero pretium eleifend. Proin libero orci, rhoncus sed neque ac, finibus dignissim erat. Nullam at mollis purus. Praesent vel auctor sem. Praesent nec nibh at elit ullamcorper placerat. Proin pellentesque orci ut risus egestas vehicula. Mauris blandit convallis venenatis.\n\n' +
	'Cras eget imperdiet elit. Donec in felis sagittis, maximus nunc at, commodo tellus. Praesent molestie fringilla neque, nec pharetra quam aliquet ac. Sed luctus sollicitudin ante, non tempus augue ornare quis. Etiam hendrerit metus ac ipsum sollicitudin, id sodales urna volutpat. Praesent cursus finibus arcu, quis pulvinar metus mollis quis. Suspendisse in enim velit. Etiam id dolor dolor. Integer fringilla ligula ultricies, tempor leo quis, luctus nisi. Mauris quis malesuada enim. In rhoncus elementum viverra. Quisque maximus lorem sit amet molestie congue. Phasellus ut eleifend lectus. Vestibulum aliquet urna ex, sit amet cursus orci mollis ut.\n\n' +
	'Sed quis aliquam urna. Integer velit sem, consequat eu fermentum eu, hendrerit sit amet mi. Nulla congue risus vel finibus consequat. Proin ornare ornare vestibulum. Aliquam varius blandit nisl, vel commodo sem sollicitudin in. Integer non consectetur purus, sit amet volutpat est. Curabitur vitae enim leo. Quisque sodales pharetra lorem, non venenatis urna luctus vel.\n\n' +
	'Nulla ac magna tempus, sollicitudin nibh vitae, suscipit velit. Aliquam ultrices erat blandit velit varius, vel ullamcorper orci lacinia. Ut fermentum magna eget turpis consequat convallis. Duis blandit rhoncus cursus. Curabitur rhoncus leo vel scelerisque porttitor. Pellentesque posuere nisi tincidunt, dapibus ipsum eu, elementum lacus. Praesent condimentum gravida ex, et auctor odio maximus eu. Praesent in velit nec sem rhoncus congue at eget lorem. Proin vitae erat lacus.';
export const generateLoremIpsum = (length: number): string => {
	length = Math.max(Math.min(11801, length), 0);
	return loremIpsum.substring(0, length);
};