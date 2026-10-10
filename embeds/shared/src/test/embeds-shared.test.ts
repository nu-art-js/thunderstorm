import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
	applyEmbedFrameHeight,
	assertEmbedOrigin,
	embedLoaderJs,
	embedPostMessageTargets,
	embedSnippet,
	frameAncestorsCsp,
	intersectEmbedOrigins,
	nextEmbedFrameHeight,
	parseEmbedOriginList
} from '../main/index.js';

describe('embeds - origins', () => {
	it('accepts exact https origins and http localhost', () => {
		expect(assertEmbedOrigin(' https://example.com ')).to.equal('https://example.com');
		expect(assertEmbedOrigin('http://localhost:3000')).to.equal('http://localhost:3000');
	});

	it('refuses paths, trailing slashes, http and junk', () => {
		for (const bad of ['https://example.com/', 'https://example.com/x', 'http://example.com', 'example.com', 'javascript:alert(1)'])
			expect(() => assertEmbedOrigin(bad), bad).to.throw();
	});

	it('parses a list: de-duplicates, enforces the limit and types', () => {
		expect(parseEmbedOriginList(['https://a.nl', 'https://a.nl', 'https://b.nl'])).to.deep.equal(['https://a.nl', 'https://b.nl']);
		expect(() => parseEmbedOriginList(['https://a.nl', 'https://b.nl'], 1)).to.throw();
		expect(() => parseEmbedOriginList('https://a.nl')).to.throw();
		expect(() => parseEmbedOriginList([1])).to.throw();
	});

	it('intersects token and current origins; builds frame-ancestors', () => {
		expect(intersectEmbedOrigins(['https://a.nl', 'https://b.nl'], ['https://b.nl'])).to.deep.equal(['https://b.nl']);
		expect(frameAncestorsCsp([])).to.equal('frame-ancestors \'none\'');
		expect(frameAncestorsCsp(['https://a.nl'])).to.equal('frame-ancestors \'self\' https://a.nl');
	});

	it('posts only to the allowed referrer, else to each allowed origin, never *', () => {
		expect(embedPostMessageTargets({referrer: 'https://a.nl/page', allowedOrigins: ['https://a.nl', 'https://b.nl'], selfOrigin: 'https://e.io'})).to.deep.equal(['https://a.nl']);
		expect(embedPostMessageTargets({referrer: 'https://evil.io/', allowedOrigins: ['https://a.nl'], selfOrigin: 'https://e.io'})).to.deep.equal(['https://a.nl', 'https://e.io']);
		expect(embedPostMessageTargets({referrer: '', allowedOrigins: [], selfOrigin: 'https://e.io'})).to.deep.equal(['https://e.io']);
	});
});

describe('embeds - frame sizing', () => {
	it('child: pads, caps and ignores jitter', () => {
		expect(nextEmbedFrameHeight(300, null)).to.equal(308);
		expect(nextEmbedFrameHeight(300.5, 309)).to.equal(null);
		expect(nextEmbedFrameHeight(99999, null)).to.equal(2000);
		expect(nextEmbedFrameHeight(-1, null)).to.equal(null);
	});

	it('parent: clamps to min/max and ignores jitter', () => {
		expect(applyEmbedFrameHeight(10, null)).to.equal(120);
		expect(applyEmbedFrameHeight(5000, null)).to.equal(2000);
		expect(applyEmbedFrameHeight(301, 300)).to.equal(null);
		expect(applyEmbedFrameHeight(NaN, null)).to.equal(null);
	});
});

describe('embeds - snippet and loader', () => {
	it('escapes snippet attributes', () => {
		const snippet = embedSnippet('https://e.io/', 'card', 'a"b<c', 'Tom & "Jerry"');
		expect(snippet).to.equal('<script src="https://e.io/embed.js" data-ts-embed="card" data-embed-token="a&quot;b&lt;c" data-embed-title="Tom &amp; &quot;Jerry&quot;" async></script>');
	});

	const run = (pageUrl: string, html: string, options: Parameters<typeof embedLoaderJs>[0]) => {
		const dom = new JSDOM(`<!doctype html><html><head></head><body>${html}</body></html>`, {url: pageUrl, runScripts: 'outside-only'});
		const loader = dom.window.document.createElement('script');
		loader.setAttribute('src', 'https://embeds.example/embed.js');
		Object.defineProperty(dom.window.document, 'currentScript', {value: loader});
		dom.window.eval(embedLoaderJs(options));
		return dom;
	};

	it('third-party page: inserts a sized iframe per placeholder and nothing else', () => {
		const dom = run('https://customer.example/', '<div data-ts-embed="card" data-embed-token="t1"></div><div data-ts-embed="card"></div>',
			{framePath: '/embed/frame', firstPartyOrigins: ['https://app.example'], bundleUrl: '/bundle.js'});
		const frames = dom.window.document.querySelectorAll('iframe');
		expect(frames).to.have.length(1);
		expect(frames[0].getAttribute('src')).to.equal('https://embeds.example/embed/frame?embed=card&token=t1');
		expect(frames[0].style.height).to.equal('120px');
		expect(dom.window.document.querySelector('script[data-ts-embed-bundle]')).to.equal(null);
	});

	it('first-party page: no iframe; loads the bundle once', () => {
		const dom = run('https://app.example/page', '<div data-ts-embed="card" data-embed-token="t1"></div><div data-ts-embed="other"></div>',
			{framePath: '/embed/frame', firstPartyOrigins: ['https://app.example'], bundleUrl: '/bundle.js'});
		expect(dom.window.document.querySelectorAll('iframe')).to.have.length(0);
		const bundles = dom.window.document.querySelectorAll('script[data-ts-embed-bundle]');
		expect(bundles).to.have.length(1);
		expect(bundles[0].getAttribute('src')).to.equal('https://embeds.example/bundle.js');
		expect(bundles[0].getAttribute('type')).to.equal('module');
	});

	it('cannot be broken out of by config values', () => {
		const js = embedLoaderJs({framePath: '/x</script><script>alert(1)</script>'});
		expect(js).to.not.contain('</script>');
	});

	it('only applies resize messages from its own iframe and origin', () => {
		const dom = run('https://customer.example/', '<div data-ts-embed="card" data-embed-token="t1"></div>', {framePath: '/f'});
		const frame = dom.window.document.querySelector('iframe')!;
		const send = (origin: string, source: unknown, data: unknown) =>
			dom.window.dispatchEvent(new dom.window.MessageEvent('message', {origin, source: source as never, data}));
		send('https://evil.io', frame.contentWindow, {source: 'ts-embed', type: 'resize', height: 500});
		expect(frame.style.height).to.equal('120px');
		send('https://embeds.example', null, {source: 'ts-embed', type: 'resize', height: 500});
		expect(frame.style.height).to.equal('120px');
		send('https://embeds.example', frame.contentWindow, {source: 'ts-embed', type: 'resize', height: 500});
		expect(frame.style.height).to.equal('500px');
		send('https://embeds.example', frame.contentWindow, {source: 'ts-embed', type: 'resize', height: 99999});
		expect(frame.style.height).to.equal('2000px');
	});
});
