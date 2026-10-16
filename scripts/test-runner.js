const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Compiling domain tests...');
  execSync(
    'npx tsc --ignoreConfig tests/run-domain-tests.ts src/domain/validation/lotValidation.ts src/domain/workflows/lotWorkflow.ts src/domain/workflows/offerWorkflow.ts src/domain/workflows/settlementWorkflow.ts src/domain/workflows/orderWorkflow.ts src/domain/calculations/feeCalculator.ts src/domain/calculations/lotCalculations.ts src/domain/projections/buyerProjections.ts src/domain/enums/index.ts src/domain/models/index.ts src/core/navigation/routingPolicy.ts src/services/auth/authInterface.ts src/services/mock/mockServices.ts src/services/mock/seedData.ts src/data/local/storage.ts --outDir dist-tests --module commonjs --target es2020 --esModuleInterop --skipLibCheck',
    { stdio: 'inherit' }
  );

  console.log('Executing test suite...');
  execSync('node dist-tests/tests/run-domain-tests.js', { stdio: 'inherit' });
} finally {
  if (fs.existsSync('dist-tests')) {
    try {
      fs.rmSync('dist-tests', { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch {
      // Ignore Windows transient file lock
    }
  }
}
