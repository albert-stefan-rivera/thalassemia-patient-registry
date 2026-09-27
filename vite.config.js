import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Basic Vite configuration for React project
export default defineConfig({
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: 5173,
		open: false
	},
	build: {
		sourcemap: true
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.js',
		css: true
	}
});
