import './style.css';

const app: HTMLElement | null = document.getElementById('app');

if (app) {
	app.innerHTML = `<h1>Hello, Webpack with TypeScript!</h1>`;
}
