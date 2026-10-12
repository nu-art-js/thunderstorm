import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {ModuleFE_Embeds_Class} from '../main/ModuleFE_Embeds.js';

const page = (html: string) => {
	const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {url: 'https://app.example/'});
	Object.assign(globalThis, {document: dom.window.document, window: dom.window});
	return dom;
};

describe('ModuleFE_Embeds - first-party mounting', () => {
	it('mounts registered components into placeholders with token and props, once', () => {
		const dom = page('<div data-ts-embed="card" data-embed-token="t1" data-embed-props=\'{"size":"s"}\'></div><div data-ts-embed="unknown"></div>');
		const embeds = new ModuleFE_Embeds_Class();
		const seen: unknown[] = [];
		embeds.registerComponent('card', (element, context) => {
			element.textContent = 'mounted';
			seen.push(context);
		});
		expect(embeds.scan(dom.window.document)).to.equal(1);
		expect(embeds.scan(dom.window.document)).to.equal(0);
		expect(seen).to.deep.equal([{key: 'card', token: 't1', props: {size: 's'}}]);
		expect(dom.window.document.querySelector('[data-ts-embed="card"]')!.textContent).to.equal('mounted');
	});

	it('a snippet script placeholder gets a container before it; malformed props are ignored', () => {
		const dom = page('<p id="p"><script data-ts-embed="card" data-embed-props="{oops"></script></p>');
		const embeds = new ModuleFE_Embeds_Class();
		let props: unknown;
		embeds.registerComponent('card', (element, context) => {
			element.textContent = 'here';
			props = context.props;
		});
		embeds.scan(dom.window.document);
		const container = dom.window.document.querySelector('[data-ts-embed-host="card"]')!;
		expect(container.textContent).to.equal('here');
		expect(container.nextElementSibling!.tagName).to.equal('SCRIPT');
		expect(props).to.deep.equal({});
	});

	it('unmountAll calls the returned unmounts', () => {
		const dom = page('<div data-ts-embed="card"></div>');
		const embeds = new ModuleFE_Embeds_Class();
		let unmounted = 0;
		embeds.registerComponent('card', () => () => unmounted++);
		embeds.scan(dom.window.document);
		embeds.unmountAll();
		expect(unmounted).to.equal(1);
	});
});
