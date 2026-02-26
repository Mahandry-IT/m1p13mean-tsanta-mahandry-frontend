import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const root = process.cwd();

const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Vars attendues
const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

const outDir = path.join(root, 'src', 'environments');
const outFile = path.join(outDir, 'environment.generated.ts');
fs.mkdirSync(outDir, { recursive: true });

const ts = `
export const environmentGenerated = {
  apiUrl: ${JSON.stringify(apiUrl)}
} as const;
`;

fs.writeFileSync(outFile, ts, 'utf8');
console.log(`[env] generated ${path.relative(root, outFile)} (API_URL=${apiUrl})`);

