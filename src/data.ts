// Remove faker import
// import { faker } from '@faker-js/faker';

// --- Enums (from OpenAPI spec) ---
export enum TransactionTypeEnum {
  LEASE = 'lease',
  SUBLEASE = 'sublease',
  GOING_CONCERN_SALE = 'going_concern_sale',
  MORTGAGEE_SALE = 'mortgagee_sale',
  STANDARD_SALE = 'standard_sale',
}

export enum BuyerTypeEnum {
  PRIVATE_EQUITY = 'Private Equity',
  PUBLICLY_LISTED_COMPANY = 'Publicly Listed Company',
  PRIVATE_BUYER = 'Private Buyer',
  VENTURE_CAPITAL = 'Venture Capital',
  REIT = 'REIT',
  GOVERNMENT = 'Government',
  INSTITUTIONAL_INVESTOR = 'Institutional Investor',
  OTHER = 'Other',
}

export enum PropertyTypeEnum {
  OFFICE = 'Office',
  RETAIL = 'Retail',
  INDUSTRIAL = 'Industrial',
  MULTIFAMILY = 'Multifamily',
  LAND = 'Land',
  HOSPITALITY = 'Hospitality',
  SPECIAL_PURPOSE = 'Special Purpose',
  MIXED_USE = 'Mixed Use',
}

export enum BrokerRoleEnum {
  BUYER_AGENT = 'buyer_agent',
  SELLER_AGENT = 'seller_agent',
  DUAL_AGENT = 'dual_agent',
  CONSULTANT = 'consultant',
  OTHER = 'other',
}

// --- Interfaces (derived from OpenAPI spec schemas) ---
export interface Address {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Property {
  propertyId: string;
  address: Address;
  propertyType: PropertyTypeEnum;
  squareFootage: number;
  zoning: string;
  yearBuilt: number | null;
  description: string | null;
}

export interface Party {
  partyId: string;
  name: string;
  classification: BuyerTypeEnum;
}

export interface Broker {
  brokerId: string;
  name: string;
  agency: string;
  role: BrokerRoleEnum;
}

export interface Financing {
  loanAmount: number;
  lender: string;
  loanType: string;
  interestRate: number | null;
  loanToValueRatio: number | null;
}

export interface Document {
  documentId: string;
  url: string;
  description: string | null;
  type: string;
}

export interface HistoricalPricing {
  date: string; // YYYY-MM-DD
  price: number;
  source: string;
}

export interface Transaction {
  transactionId: string;
  transactionDate: string; // YYYY-MM-DD
  transactionType: TransactionTypeEnum;
  price: number;
  currency: string;
  leaseTerms: string | null;
  mortgageeConditions: string | null;
  propertyId: string; // Reference to Property
  buyerId: string;    // Reference to Party (Buyer)
  sellerId: string;   // Reference to Party (Seller)
  brokerIds: string[]; // Reference to Brokers
  financing: Financing | null;
  documentIds: string[]; // Reference to Documents
  historicalPricing: HistoricalPricing[];
  createdAt: Date;
  updatedAt: Date;
  // Include original objects for easier lookup if needed, or rely on IDs
  property?: Property;
  buyer?: Party;
  seller?: Party;
  brokers?: Broker[];
  documents?: Document[];
}

// --- Simple Mock Data Generation Functions (No Faker) ---

const randomUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min: number, max: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
};

const randomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const randomBoolean = (probability: number = 0.5): boolean => {
    return Math.random() < probability;
};

// --- Updated Creation Functions (No Faker) ---

const createAddress = (): Address => ({
  streetAddress: `${randomInt(100, 9999)} Main St`, 
  city: randomElement(['Metropolis', 'Gotham', 'Star City', 'Central City']),
  state: randomElement(['NY', 'CA', 'IL', 'TX', 'FL']),
  postalCode: randomInt(10000, 99999).toString(),
  country: 'USA',
});

const createProperty = (id: string): Property => ({
  propertyId: id,
  address: createAddress(),
  propertyType: randomElement(Object.values(PropertyTypeEnum)),
  squareFootage: randomInt(1000, 500000),
  zoning: randomElement(['C-1', 'C-2', 'C-3', 'I-1', 'I-2', 'R-M', 'PUD']),
  yearBuilt: randomBoolean(0.8) ? randomInt(1960, 2023) : null,
  description: randomBoolean(0.6) ? `Generic description for property ${id}` : null,
});

const createParty = (id: string): Party => ({
  partyId: id,
  name: `Company ${randomInt(1, 1000)} Inc.`,
  classification: randomElement(Object.values(BuyerTypeEnum)),
});

const createBroker = (id: string): Broker => ({
  brokerId: id,
  name: `Broker ${randomInt(1, 500)}`,
  agency: `Agency ${randomInt(1, 200)} Ltd.`,
  role: randomElement(Object.values(BrokerRoleEnum)),
});

const createFinancing = (transactionPrice: number): Financing | null => {
  if (randomBoolean(0.7)) { 
    const loanAmount = randomInt(Math.floor(transactionPrice * 0.3), Math.floor(transactionPrice * 0.9));
    const ltv = transactionPrice > 0 ? parseFloat((loanAmount / transactionPrice).toFixed(2)) : 0;
    return {
      loanAmount: loanAmount,
      lender: `Bank ${randomInt(1, 50)} Corp`,
      loanType: randomElement(['CMBS', 'Portfolio', 'Bridge', 'Construction']),
      interestRate: randomBoolean(0.9) ? randomFloat(3.5, 8.5, 2) : null,
      loanToValueRatio: ltv,
    };
  }
  return null;
};

const createDocument = (id: string, type: string): Document => ({
  documentId: id,
  url: `http://example.com/docs/${id}.pdf`,
  description: `${type} Document Ref ${id}`,
  type: type,
});

const createHistoricalPricing = (transactionDate: Date, initialPrice: number): HistoricalPricing[] => {
  const pricing: HistoricalPricing[] = [];
  const numHistorical = randomInt(0, 3);
  let lastPrice = initialPrice;
  const startYear = 1980; // Define start year for history

  for (let i = 0; i < numHistorical; i++) {
    const maxYearsAgo = Math.max(1, transactionDate.getFullYear() - startYear);
    if (maxYearsAgo <= 1 && transactionDate.getFullYear() === startYear) continue; // Avoid issues if transaction is in startYear
    
    const yearsAgo = randomInt(1, maxYearsAgo);
    const historicalDate = new Date(transactionDate);
    historicalDate.setFullYear(transactionDate.getFullYear() - yearsAgo);

    const priceFluctuation = randomFloat(0.7, 1.3, 2);
    lastPrice = Math.max(10000, Math.floor(lastPrice / priceFluctuation)); 

    pricing.push({
      date: historicalDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      price: lastPrice,
      source: randomElement(['Previous Sale', 'Appraisal', 'Tax Assessment']),
    });
  }
  return pricing.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// --- Main Data Generation & Storage ---

let properties: Record<string, Property> = {};
let parties: Record<string, Party> = {};
let brokers: Record<string, Broker> = {};
let documents: Record<string, Document> = {};
let transactions: Transaction[] = [];

const NUM_PROPERTIES = 200;
const NUM_PARTIES = 400; // Buyers & Sellers
const NUM_BROKERS = 100;
const NUM_TRANSACTIONS = 1000;

const generateAllData = () => {
  // Reset stores
  properties = {};
  parties = {};
  brokers = {};
  documents = {};
  transactions = [];

  // Generate independent entities first
  for (let i = 0; i < NUM_PROPERTIES; i++) {
    const id = randomUuid();
    properties[id] = createProperty(id);
  }

  for (let i = 0; i < NUM_PARTIES; i++) {
    const id = randomUuid();
    parties[id] = createParty(id);
  }

  for (let i = 0; i < NUM_BROKERS; i++) {
    const id = randomUuid();
    brokers[id] = createBroker(id);
  }

  const propertyIds = Object.keys(properties);
  const partyIds = Object.keys(parties);
  const brokerIds = Object.keys(brokers);

  // Generate transactions, linking entities
  for (let i = 0; i < NUM_TRANSACTIONS; i++) {
    const transactionId = randomUuid();
    const transactionDate = randomDate(new Date(1980, 0, 1), new Date(2025, 11, 31));
    const transactionType = randomElement(Object.values(TransactionTypeEnum));
    const price = randomInt(50000, 100000000);

    // Ensure buyer and seller are different
    let buyerId = randomElement(partyIds);
    let sellerId = randomElement(partyIds);
    while (buyerId === sellerId) {
      sellerId = randomElement(partyIds);
    }

    const propertyId = randomElement(propertyIds);

    // Select 1-3 brokers
    const numBrokers = randomInt(1, Math.min(3, brokerIds.length));
    const selectedBrokerIds = [...brokerIds].sort(() => 0.5 - Math.random()).slice(0, numBrokers);

    // Create related documents
    const relatedDocuments: Document[] = [];
    const docTypes = ['Deed', 'Listing Flyer', 'Appraisal', 'Environmental Report', 'Lease Agreement'];
    const numDocs = randomInt(0, 4);
    for (let d = 0; d < numDocs; d++) {
      const docId = randomUuid();
      const docType = randomElement(docTypes);
      const doc = createDocument(docId, docType);
      documents[docId] = doc;
      relatedDocuments.push(doc);
    }

    const transaction: Transaction = {
      transactionId: transactionId,
      transactionDate: transactionDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      transactionType: transactionType,
      price: price,
      currency: 'USD',
      leaseTerms: transactionType === TransactionTypeEnum.LEASE || transactionType === TransactionTypeEnum.SUBLEASE
        ? `Term: ${randomInt(1, 10)} years, Rate: $${randomFloat(10, 100, 2)}/sqft/yr`
        : null,
      mortgageeConditions: transactionType === TransactionTypeEnum.MORTGAGEE_SALE
        ? 'Sold As-Is via foreclosure auction.'
        : null,
      propertyId: propertyId,
      buyerId: buyerId,
      sellerId: sellerId,
      brokerIds: selectedBrokerIds,
      financing: createFinancing(price),
      documentIds: relatedDocuments.map(d => d.documentId),
      historicalPricing: createHistoricalPricing(transactionDate, price),
      createdAt: randomDate(new Date(1970, 0, 1), transactionDate), // Ensure created before transaction date
      updatedAt: randomDate(transactionDate, new Date()),
    };

    transactions.push(transaction);
  }
  console.log(`Generated ${NUM_PROPERTIES} properties.`);
  console.log(`Generated ${NUM_PARTIES} parties.`);
  console.log(`Generated ${NUM_BROKERS} brokers.`);
  console.log(`Generated ${Object.keys(documents).length} documents.`);
  console.log(`Generated ${NUM_TRANSACTIONS} transactions.`);
};

// Initial data generation on load
generateAllData();

// --- Exported Data & Functions ---

// Export the function to regenerate data
export { generateAllData };

// Export current data stores (these will be mutated by generateAllData)
export { properties, parties, brokers, documents, transactions };

// Function to add full objects if needed (can be called in route handlers)
export const enrichTransaction = (t: Transaction): Transaction => ({
  ...t,
  property: properties[t.propertyId],
  buyer: parties[t.buyerId],
  seller: parties[t.sellerId],
  brokers: t.brokerIds.map(id => brokers[id]).filter(b => b), // Filter out undefined if ID is invalid
  documents: t.documentIds.map(id => documents[id]).filter(d => d), // Filter out undefined
});


// --- Helper function for filtering --- (Basic example)
export const filterTransactions = (params: any): Transaction[] => {
    let filtered = [...transactions]; // Use current transactions

    if (params.startDate) {
        filtered = filtered.filter(t => new Date(t.transactionDate) >= new Date(params.startDate));
    }
    if (params.endDate) {
        filtered = filtered.filter(t => new Date(t.transactionDate) <= new Date(params.endDate));
    }
    if (params.transactionType) {
        filtered = filtered.filter(t => t.transactionType === params.transactionType);
    }
    if (params.buyerType) {
        const buyerParties = Object.values(parties).filter(p => p.classification === params.buyerType).map(p => p.partyId);
        filtered = filtered.filter(t => buyerParties.includes(t.buyerId));
    }
    if (params.minPrice) {
        filtered = filtered.filter(t => t.price >= Number(params.minPrice));
    }
    if (params.maxPrice) {
        filtered = filtered.filter(t => t.price <= Number(params.maxPrice));
    }

    // Location filters require enrichment. Careful about performance on large datasets.
    let needsEnrichment = !!(params.country || params.state || params.city);
    let enrichedData = needsEnrichment ? filtered.map(enrichTransaction) : filtered;

    if (params.country) {
        enrichedData = enrichedData.filter(t => t.property?.address.country === params.country);
    }
     if (params.state) {
        enrichedData = enrichedData.filter(t => t.property?.address.state === params.state);
    }
     if (params.city) {
        enrichedData = enrichedData.filter(t => t.property?.address.city === params.city);
    }

    // If we enriched, return the base filtered data corresponding to the enriched results
    // This avoids returning the enriched objects directly from the filter function
    if (needsEnrichment) {
        const filteredIds = new Set(enrichedData.map(t => t.transactionId));
        return filtered.filter(t => filteredIds.has(t.transactionId));
    }

    return filtered;
};

// --- Helper function for sorting --- (Basic example)
export const sortTransactions = (data: Transaction[], sortBy: string, sortOrder: string): Transaction[] => {
    const order = sortOrder === 'asc' ? 1 : -1;
    const dataToSort = [...data]; // Create a mutable copy

    // Sort the mutable copy
    dataToSort.sort((a, b) => {
        let valA: any;
        let valB: any;

        // Optimization: Avoid repeated lookups if possible, though might be complex
        const propA = properties[a.propertyId];
        const propB = properties[b.propertyId];
        const buyerA = parties[a.buyerId];
        const buyerB = parties[b.buyerId];

        switch (sortBy) {
            case 'transactionDate':
                valA = new Date(a.transactionDate).getTime();
                valB = new Date(b.transactionDate).getTime();
                break;
            case 'price':
                valA = a.price;
                valB = b.price;
                break;
            case 'buyerType':
                valA = buyerA?.classification || '';
                valB = buyerB?.classification || '';
                break;
             case 'propertyType':
                valA = propA?.propertyType || '';
                valB = propB?.propertyType || '';
                break;
            case 'squareFootage':
                valA = propA?.squareFootage || 0;
                valB = propB?.squareFootage || 0;
                break;
             case 'createdAt':
                valA = a.createdAt.getTime();
                valB = b.createdAt.getTime();
                break;
            case 'updatedAt':
                 valA = a.updatedAt.getTime();
                 valB = b.updatedAt.getTime();
                 break;
            default:
                // Default sort by transactionDate if sortBy is invalid
                 valA = new Date(a.transactionDate).getTime();
                 valB = new Date(b.transactionDate).getTime();
        }

        if (valA === null || valA === undefined) valA = -Infinity * order; // Handle nulls/undefined
        if (valB === null || valB === undefined) valB = -Infinity * order;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * order;
        }
        // Basic numeric comparison
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
    });

    return dataToSort; // Return the sorted copy
}; 