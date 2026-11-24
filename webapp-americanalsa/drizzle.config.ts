import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL must be set in the environment or .env file.');
}

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/core/persistence/schema.ts',
	dbCredentials: {
		url: databaseUrl,
	},
});
