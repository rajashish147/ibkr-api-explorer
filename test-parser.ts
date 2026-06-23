import fs from 'fs';

// Since we're running with tsx, we can register tsconfig-paths
// but we need to run it properly. Let's just use tsx directly.
import { convertSwaggerToOpenApi, detectSpecVersion } from './src/lib/parsers/swagger-parser';
import { parseOpenApiSpec } from './src/lib/parsers/openapi-parser';
import { ParsedEndpoint } from './src/types/endpoint';
import { OpenApiSpec } from './src/types/openapi';
import { classifyEndpoint } from './src/lib/parsers/ibkr-classifier';

async function run() {
  console.log('Loading api-docs.json...');
  const start = performance.now();
  const rawData = fs.readFileSync('./api/api-docs.json', 'utf8');
  const raw = JSON.parse(rawData);
  const version = detectSpecVersion(raw);
  
  let spec: OpenApiSpec;
  let endpoints: ParsedEndpoint[];
  
  if (version === 'swagger2') {
    spec = convertSwaggerToOpenApi(raw as Parameters<typeof convertSwaggerToOpenApi>[0]);
    endpoints = parseOpenApiSpec(spec);
  } else {
    spec = raw as OpenApiSpec;
    endpoints = parseOpenApiSpec(spec);
  }
  
  // Re-classify using our logic
  endpoints = endpoints.map(ep => {
    return {
      ...ep,
      tags: [classifyEndpoint(ep.path, ep.tags)]
    };
  });
  
  const end = performance.now();
  
  const tags = new Set<string>();
  const categories = new Map<string, number>();
  endpoints.forEach(ep => {
    ep.tags.forEach(t => tags.add(t));
    const cat = ep.tags[0] || 'Other';
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });
  
  const schemasCount = Object.keys(spec.components?.schemas || {}).length;
  
  console.log('--- Results ---');
  console.log(`Total endpoints parsed: ${endpoints.length}`);
  console.log(`Total schemas parsed: ${schemasCount}`);
  console.log(`Total tags parsed: ${tags.size}`);
  console.log('Category counts:');
  categories.forEach((count, cat) => console.log(`  ${cat}: ${count}`));
  console.log(`Import duration: ${(end - start).toFixed(2)}ms`);
  
  console.log('\nEndpoints classified as Other:');
  endpoints.filter(ep => ep.tags[0] === 'Other').forEach(ep => console.log(ep.path));
  
  const memoryUsage = process.memoryUsage();
  console.log(`Memory usage estimate: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

run().catch(console.error);
