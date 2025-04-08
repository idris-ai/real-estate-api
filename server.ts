import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const app = express();
const port = 8081; // Port for the Swagger UI server

// --- Load the OpenAPI Specification ---
let swaggerDocument: any = null;
try {
  // Use process.cwd() which refers to the directory where the script was launched from
  const specPath = path.join(process.cwd(), 'openapi.yaml');
  console.log(`Attempting to load OpenAPI spec from: ${specPath}`); // Add logging
  const yamlSpec = fs.readFileSync(specPath, 'utf8');
  swaggerDocument = yaml.load(yamlSpec);
  console.log('OpenAPI specification loaded successfully.');
} catch (e) {
  console.error('Failed to load openapi.yaml:', e);
  process.exit(1); // Exit if the spec can't be loaded
}

// --- Setup Swagger UI ---
// Serve Swagger UI assets
app.use('/api-docs', swaggerUi.serve);

// Setup the Swagger UI endpoint
app.get('/api-docs', swaggerUi.setup(swaggerDocument));

// --- Simple Root Endpoint ---
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>CRE API Documentation Server</h1>
    <p>Swagger UI is available at <a href="/api-docs">/api-docs</a>.</p>
  `);
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Swagger UI server running at http://localhost:${port}`);
  console.log(`Access the interactive API documentation at http://localhost:${port}/api-docs`);
}); 