import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const app = express();
const port = 8081; // Port for the Swagger UI server

// --- Load the OpenAPI Specification ---
let swaggerDocument: object | null = null;
const specPath = path.resolve(process.cwd(), 'openapi.yaml');

try {
  console.log(`Attempting to load OpenAPI spec from: ${specPath}`);
  const yamlSpec = fs.readFileSync(specPath, 'utf8');
  swaggerDocument = yaml.load(yamlSpec) as object;
  if (!swaggerDocument) {
      throw new Error('Parsed Swagger document is null or undefined.');
  }
  console.log('OpenAPI specification loaded successfully.');
} catch (e) {
  console.error(`Failed to load or parse openapi.yaml from ${specPath}:`, e);
  process.exit(1); // Exit if the spec can't be loaded
}

// --- Setup Swagger UI ---
if (swaggerDocument) {
    // Serve Swagger UI assets and the UI itself
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(`Swagger UI setup at /api-docs`);
} else {
    console.error('Swagger document was not loaded, cannot set up UI.');
    process.exit(1);
}

// --- Simple Root Endpoint ---
app.get('/', (req, res) => {
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