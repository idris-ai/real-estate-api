import express = require('express');
import cors = require('cors');
import path = require('path');
import fs = require('fs');
import yaml = require('js-yaml');

// Use require for CommonJS imports
const dataModule = require('./data');
let { transactions, properties, parties, generateAllData, enrichTransaction, filterTransactions, sortTransactions } = dataModule;

const app = express();
const port = 3001; // API server port

// --- Load OpenAPI Spec ---
let swaggerDocument: object | null = null;
let rawYamlSpec: string | null = null;
let rawJsonSpec: string | null = null; // Variable for JSON content
const yamlSpecPath = path.resolve(process.cwd(), 'openapi.yaml');
const jsonSpecPath = path.resolve(process.cwd(), 'openapi.json'); // Path for JSON file

try {
  console.log(`Attempting to load OpenAPI YAML spec from: ${yamlSpecPath}`);
  rawYamlSpec = fs.readFileSync(yamlSpecPath, 'utf8');
  swaggerDocument = yaml.load(rawYamlSpec) as object;
  if (!swaggerDocument) {
      throw new Error('Parsed Swagger document is null or undefined.');
  }
  console.log('OpenAPI YAML specification loaded successfully.');
  
  // Try loading the JSON file as well
  try {
      console.log(`Attempting to load OpenAPI JSON spec from: ${jsonSpecPath}`);
      rawJsonSpec = fs.readFileSync(jsonSpecPath, 'utf8');
      console.log('OpenAPI JSON specification loaded successfully.');
  } catch (jsonError) {
      console.error(`Failed to load openapi.json from ${jsonSpecPath}:`, jsonError);
      console.warn('/openapi.json endpoint will not be available.');
  }
  
} catch (e) {
  console.error(`Failed to load or parse openapi.yaml from ${yamlSpecPath}:`, e);
  console.warn('Swagger UI, /openapi.yaml, and /openapi.json endpoints will not be available.');
}

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Middleware to parse JSON bodies

// --- Helper Functions ---
const getPaginatedData = (data: any[], limit: number, offset: number) => {
    return data.slice(offset, offset + limit);
};

// --- Routes ---

// GET /transactions
app.get('/v1/transactions', (req: express.Request, res: express.Response) => {
    // Re-assign transactions from the potentially updated dataModule
    transactions = dataModule.transactions;

    const { 
        startDate, endDate, buyerType, transactionType, 
        minPrice, maxPrice, country, state, city, 
        limit = '20', offset = '0', 
        sortBy = 'transactionDate', sortOrder = 'desc' 
    } = req.query;

    const numLimit = parseInt(limit as string, 10);
    const numOffset = parseInt(offset as string, 10);

    if (isNaN(numLimit) || isNaN(numOffset) || numLimit <= 0 || numOffset < 0) {
        return res.status(400).json({ code: 'INVALID_PAGINATION', message: 'Invalid limit or offset parameters.' });
    }

    // 1. Filter
    let filteredData = filterTransactions(req.query);

    // 2. Sort
    const validSortOrder = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc';
    let sortedData = sortTransactions(filteredData, sortBy as string, validSortOrder);

    // 3. Paginate
    const paginatedData = getPaginatedData(sortedData, numLimit, numOffset);

    // 4. Enrich data for response (add full objects)
    const responseData = paginatedData.map(enrichTransaction);

    // 5. Prepare metadata
    const metadata = {
        totalRecords: sortedData.length,
        limit: numLimit,
        offset: numOffset,
        lastUpdated: new Date().toISOString(), // Use current time as mock last updated
    };

    res.status(200).json({ metadata, data: responseData });
});

// GET /transactions/:transactionId
app.get('/v1/transactions/:transactionId', (req: express.Request, res: express.Response) => {
    // Re-assign transactions from the potentially updated dataModule
    transactions = dataModule.transactions;

    const { transactionId } = req.params;
    const transaction = transactions.find((t: any) => t.transactionId === transactionId);

    if (!transaction) {
        return res.status(404).json({
            code: 'NOT_FOUND',
            message: `Transaction with ID '${transactionId}' not found.`
        });
    }

    // Enrich the single transaction with full related objects
    const enriched = enrichTransaction(transaction);

    res.status(200).json(enriched);
});

// GET /trends - Mock Implementation
app.get('/v1/trends', (req: express.Request, res: express.Response) => {
    const { 
        startDate, endDate, transactionType, 
        country, state, city, 
        aggregationInterval = 'year', 
        metrics = 'totalSalesVolume,averagePricePerSqft,transactionCount' 
    } = req.query;

    // --- Mock Trends Logic (same as before) ---
    const trendData: any[] = [];
    const currentYear = new Date().getFullYear();
    const metricList = (metrics as string).split(',');
    const filtersApplied = { ...req.query };

    for (let year = currentYear - 2; year <= currentYear; year++) {
        if (startDate && year < new Date(startDate as string).getFullYear()) continue;
        if (endDate && year > new Date(endDate as string).getFullYear()) continue;

        const intervalData: any = { interval: year.toString() };
        
        if (metricList.includes('totalSalesVolume')) {
            intervalData.totalSalesVolume = Math.floor(Math.random() * 500000000) + 100000000;
        }
        if (metricList.includes('averagePricePerSqft')) {
            intervalData.averagePricePerSqft = parseFloat((Math.random() * 300 + 200).toFixed(2));
        }
         if (metricList.includes('transactionCount')) {
            intervalData.transactionCount = Math.floor(Math.random() * 150) + 50;
        }
         if (metricList.includes('leaseRateAverage')) {
            intervalData.leaseRateAverage = parseFloat((Math.random() * 40 + 20).toFixed(2));
        }
         if (metricList.includes('buyerTypeDistribution')) {
            intervalData.buyerTypeDistribution = {
                'Private Equity': Math.floor(Math.random() * 50),
                'REIT': Math.floor(Math.random() * 30),
                'Private Buyer': Math.floor(Math.random() * 70)
            };
        }
        trendData.push(intervalData);
    }
    // --- End Mock Trends Logic ---

    const metadata = {
        filters: filtersApplied,
        lastUpdated: new Date().toISOString(),
    };

    res.status(200).json({ metadata, data: trendData });
});

// POST /reset-data (Added endpoint)
app.post('/v1/reset-data', (req: express.Request, res: express.Response) => {
    try {
        console.log('Received request to reset data...');
        generateAllData(); // Call the exported function to regenerate
        // Re-assign local references after regeneration
        transactions = dataModule.transactions;
        properties = dataModule.properties;
        parties = dataModule.parties;
        console.log('Mock data regenerated successfully.');
        res.status(200).json({ message: 'Mock data regenerated successfully.' });
    } catch (error) {
        console.error('Error regenerating mock data:', error);
        res.status(500).json({ code: 'REGENERATION_FAILED', message: 'Failed to regenerate mock data.' });
    }
});

// --- Setup Swagger UI Route ---
// ... existing setup ...

// --- Add Route to Serve openapi.yaml ---
// ... existing setup ...

// --- Add Route to Serve openapi.json ---
if (rawJsonSpec) {
    app.get('/openapi.json', (req: express.Request, res: express.Response) => {
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        res.send(rawJsonSpec);
    });
    console.log(`OpenAPI JSON spec available at http://localhost:${port}/openapi.json`);
}

// --- Basic Root Endpoint ---
app.get('/', (req: express.Request, res: express.Response) => {
    res.send(`
        <h1>CRE Mock API Server</h1>
        <p>Mock API endpoints available at /v1/...</p>
        <p>POST to /v1/reset-data to regenerate mock data.</p>
        ${swaggerDocument ? '<p>Swagger UI available at <a href="/api-docs">/api-docs</a>.</p>' : '<p>(Swagger UI failed to load)</p>'}
        ${rawYamlSpec ? '<p>Raw OpenAPI YAML spec available at <a href="/openapi.yaml">/openapi.yaml</a>.</p>' : '<p>(OpenAPI YAML spec file failed to load)</p>'}
        ${rawJsonSpec ? '<p>Raw OpenAPI JSON spec available at <a href="/openapi.json">/openapi.json</a>.</p>' : '<p>(OpenAPI JSON spec file failed to load)</p>'}
    `);
});

// --- Error Handling (Basic) ---
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`CRE Mock API server running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log(`  GET http://localhost:${port}/v1/transactions`);
    console.log(`  GET http://localhost:${port}/v1/transactions/:transactionId`);
    console.log(`  GET http://localhost:${port}/v1/trends`);
    console.log(`  POST http://localhost:${port}/v1/reset-data`);
    if (rawJsonSpec) {
        console.log(`Raw OpenAPI JSON spec available at http://localhost:${port}/openapi.json`);
    }
}); 