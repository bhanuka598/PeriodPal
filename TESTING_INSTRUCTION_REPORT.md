# Testing Instruction Report

## Table of Contents
1. [How to Run Unit Tests](#how-to-run-unit-tests)
2. [Integration Testing Setup and Execution](#integration-testing-setup-and-execution)
3. [Performance Testing Setup and Execution](#performance-testing-setup-and-execution)
4. [Testing Environment Configuration Details](#testing-environment-configuration-details)

---

## 1. How to Run Unit Tests

### Prerequisites
- Node.js installed (version 14+ recommended)
- npm installed
- Backend dependencies installed: `npm install`

### Test Framework
- **Framework**: Jest
- **Database**: MongoDB Memory Server (in-memory database for isolated testing)
- **HTTP Testing**: Supertest (for integration tests)

### Running Unit Tests

#### Run All Tests
```bash
cd backend
npm test
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```
Tests automatically re-run when files change.

#### Run Tests with Coverage Report
```bash
npm run test:coverage
```
Generates a coverage report in the `coverage/` directory.

### Running Specific Tests

#### Test Specific Model (Unit)
```bash
npm test -- MenstrualRecord.test.js
npm test -- User.test.js
npm test -- Product.test.js
```

#### Test Specific Controller (Unit)
```bash
npm test -- authController.test.js
npm test -- cartController.test.js
npm test -- productController.test.js
```

#### Run Only Unit Tests
```bash
npm test -- --testPathPattern="unit/"
```

#### Run Only Integration Tests
```bash
npm test -- --testPathPattern="integration/"
```

#### Test with Pattern
```bash
npm test -- --testNamePattern="should create"
```

#### Run Only Failed Tests
```bash
npm test -- --onlyFailures
```

### Unit Test Structure
```
backend/tests/
├── setup.js                          # Test environment setup
├── README.md                         # Unit testing documentation
├── unit/
│   ├── models/                       # Model unit tests (7 models)
│   │   ├── Cart.test.js
│   │   ├── Inventory.test.js
│   │   ├── MenstrualRecord.test.js
│   │   ├── Order.test.js
│   │   ├── OTP.test.js
│   │   ├── Product.test.js
│   │   └── User.test.js
│   └── controllers/                  # Controller unit tests (9 controllers)
│       ├── authController.test.js
│       ├── cartController.test.js
│       ├── forgotPasswordController.test.js
│       ├── inventoryController.test.js
│       ├── menstrualRecordController.test.js
│       ├── orderController.test.js
│       ├── otpController.test.js
│       ├── productController.test.js
│       └── userController.test.js
```

### Unit Test Coverage

#### Models (7 total)
- **Cart**: Schema validation, item validation, status enum, CRUD operations
- **Inventory**: Stock validation, unique constraints, location indexing
- **MenstrualRecord**: Date validation, flow intensity enum, symptoms array
- **Order**: Price validation, payment status enum, order status tracking
- **OTP**: Expiration, purpose enum, verification workflow
- **Product**: Price/stock validation, priority tag enum, category filtering
- **User**: Password hashing, email validation, role enum

#### Controllers (9 total)
- **authController**: Register, login, demo login, password validation
- **cartController**: Add/remove items, merge guest cart, cart summary
- **forgotPasswordController**: OTP generation, verification, password reset
- **inventoryController**: CRUD, stock adjustment, geocoding
- **menstrualRecordController**: CRUD, email reminders, admin analytics
- **orderController**: Checkout, payment, contact update, donor analytics
- **otpController**: Send, verify, resend OTP with rate limiting
- **productController**: CRUD, image upload, search/filter
- **userController**: Profile management, admin user management

### Test Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |
| `npm test -- --verbose` | Show detailed output |
| `npm test -- --silent` | Suppress console output |
| `npm test -- --testTimeout=10000` | Increase timeout to 10s |
| `npm test -- --maxWorkers=2` | Limit parallel workers |

---

## 2. Integration Testing Setup and Execution

### Integration Test Structure
```
backend/tests/integration/
├── setup.js                          # Integration test environment setup
├── auth.integration.test.js         # Auth API integration tests
├── product.integration.test.js      # Product API integration tests
├── cart.integration.test.js         # Cart API integration tests
├── order.integration.test.js        # Order API integration tests
├── user.integration.test.js         # User API integration tests
├── menstrualRecord.integration.test.js  # Menstrual record API tests
└── inventory.integration.test.js    # Inventory API integration tests
```

### Integration Test Coverage (8 total)
- **Auth API**: Full auth flow (register, login, get profile), error scenarios, token validation
- **Product API**: CRUD operations with authentication, filtering, search, validation errors
- **Cart API**: Add/remove items, guest cart, cart merge, summary calculations
- **Order API**: Complete checkout flow, payment processing, stock updates, contact management
- **User API**: Profile management, password updates, admin operations (CRUD users)
- **Menstrual Record API**: CRUD operations, date validation, email reminders, analytics
- **Inventory API**: CRUD operations, stock adjustments, filtering, geocoding

### Running Integration Tests

#### Run All Integration Tests
```bash
cd backend
npm test -- --testPathPattern="integration/"
```

#### Run Specific Integration Test Suite
```bash
npm test -- auth.integration.test.js
npm test -- product.integration.test.js
npm test -- cart.integration.test.js
npm test -- order.integration.test.js
npm test -- user.integration.test.js
npm test -- menstrualRecord.integration.test.js
npm test -- inventory.integration.test.js
```

### Integration Testing Concepts

1. **End-to-End API Testing**: Tests actual HTTP requests through the full Express application
2. **Database Integration**: Real MongoDB operations with in-memory database
3. **Authentication Flow**: Tests complete auth flows (register → login → protected routes)
4. **Multi-Resource Workflows**: Tests interactions between different resources (cart → order → payment)
5. **Error Scenarios**: Tests validation errors, unauthorized access, and edge cases
6. **Guest vs Authenticated Users**: Tests both guest and authenticated user flows

### Integration Test Example Pattern

```javascript
const request = require('supertest');
const { app } = require('./setup');
const Model = require('../../src/models/MyModel');

describe('My API Integration Tests', () => {
  let authToken;

  beforeEach(async () => {
    // Setup: Create test user and get token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
      role: 'beneficiary',
      location: 'Colombo'
    });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'Test@1234' });

    authToken = loginResponse.body.token;
  });

  it('should create resource with authentication', async () => {
    const response = await request(app)
      .post('/api/resources')
      .set('Authorization', authToken)
      .send({ name: 'Test Resource' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.resource.name).toBe('Test Resource');
  });

  it('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/resources')
      .send({ name: 'Test Resource' })
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
```

---

## 3. Performance Testing Setup and Execution

### Prerequisites
1. Ensure the backend server is running on `http://localhost:5000`
2. Install Artillery: `npm install --save-dev artillery` (already installed in project)

### Performance Test Framework
- **Tool**: Artillery.io
- **Purpose**: Load testing and performance benchmarking
- **Configuration**: YAML files in `backend/performance-tests/`

### Performance Test Scenarios

#### 1. Baseline Load Test (`baseline-load-test.yml`)
Tests the API under normal load conditions:
- Warm up: 10 requests/sec for 60 seconds
- Sustained load: 20 requests/sec for 120 seconds
- Cool down: 10 requests/sec for 60 seconds
- Tests public endpoints (health check, products)

**Run:** `npm run perf:baseline`

#### 2. Stress Load Test (`stress-load-test.yml`)
Tests the API under high load to find breaking points:
- Initial load: 50 requests/sec for 60 seconds
- High load: 100 requests/sec for 120 seconds
- Peak stress: 200 requests/sec for 60 seconds
- Recovery: 50 requests/sec for 60 seconds

**Run:** `npm run perf:stress`

#### 3. Spike Load Test (`spike-load-test.yml`)
Tests how the API handles sudden traffic spikes:
- Normal traffic: 10 requests/sec for 30 seconds
- Spike: 500 requests/sec for 30 seconds
- Recovery: 10 requests/sec for 60 seconds

**Run:** `npm run perf:spike`

#### 4. Authenticated Load Test (`authenticated-load-test.yml`)
Tests authenticated user flows:
- Warm up: 5 requests/sec for 60 seconds
- Sustained load: 15 requests/sec for 120 seconds
- Cool down: 5 requests/sec for 60 seconds
- Tests login, profile, and orders endpoints

**Run:** `npm run perf:auth`

### Running Performance Tests

#### Start the Backend Server
```bash
cd backend
npm run dev
```

#### Run Performance Tests
```bash
# Run baseline test
npm run perf:baseline

# Run stress test
npm run perf:stress

# Run spike test
npm run perf:spike

# Run authenticated test
npm run perf:auth
```

### Understanding Performance Results

Artillery provides detailed metrics including:
- **Response Time**: p95, p99, min, max, median
- **Request Count**: Total requests, successful, failed
- **Throughput**: Requests per second (RPS)
- **Error Rate**: Percentage of failed requests

#### Key Metrics to Monitor
- **p95 Response Time**: 95% of requests complete within this time (aim for < 500ms)
- **p99 Response Time**: 99% of requests complete within this time (aim for < 1s)
- **Error Rate**: Should be 0% for stable performance
- **RPS**: Requests per second the API can handle

### Generating HTML Reports

After running a test, generate an HTML report:
```bash
npm run perf:report
```
This creates `performance-report.html` with detailed visualizations.

### Customizing Performance Tests

#### Modify Load Patterns
Edit the `phases` section in each YAML file:
```yaml
phases:
  - duration: 60        # Duration in seconds
    arrivalRate: 10     # Requests per second
    name: "Phase name"
```

#### Add New Endpoints
Add new flow steps to the `scenarios` section:
```yaml
flow:
  - get:
      url: "/api/endpoint"
      name: "Endpoint Name"
      expect:
        - statusCode: 200
```

#### Test with Authentication
Use the `capture` feature to store tokens:
```yaml
- post:
    url: "/api/users/login"
    capture:
      - json: "$.token"
        as: "authToken"
- get:
    url: "/api/protected"
    headers:
      Authorization: "{{ $authToken }}"
```

### Performance Testing Best Practices

1. **Run tests during off-peak hours** to avoid affecting production
2. **Monitor system resources** (CPU, memory, disk I/O) during tests
3. **Test against a staging environment** that mirrors production
4. **Compare results over time** to detect performance regressions
5. **Set up alerts** for performance degradation in production

### Performance Testing Troubleshooting

#### Connection Refused
Ensure the backend server is running on port 5000.

#### High Error Rates
- Check if the API endpoints are correctly configured
- Verify authentication tokens are valid
- Ensure the database is accessible

#### Slow Response Times
- Check database query performance
- Verify server resources (CPU, memory)
- Review middleware and authentication logic

---

## 4. Testing Environment Configuration Details

### Jest Configuration (`backend/jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/routes/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000
};
```

### Test Environment Setup (`backend/tests/setup.js`)

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});
```

### Environment Configuration

#### Test Database
- **Type**: In-memory MongoDB (MongoDB Memory Server)
- **Purpose**: Isolated testing without external dependencies
- **Setup**: Automatically created and destroyed for each test suite
- **Cleanup**: Database is cleared after each test

#### Test Dependencies (package.json)

```json
{
  "devDependencies": {
    "artillery": "^2.0.30",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^9.1.6",
    "nodemon": "^3.1.11",
    "supertest": "^6.3.4"
  }
}
```

#### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "perf:baseline": "artillery run performance-tests/baseline-load-test.yml",
    "perf:stress": "artillery run performance-tests/stress-load-test.yml",
    "perf:spike": "artillery run performance-tests/spike-load-test.yml",
    "perf:auth": "artillery run performance-tests/authenticated-load-test.yml",
    "perf:report": "artillery report --output performance-report.html"
  }
}
```

### Testing Environment Requirements

#### System Requirements
- **Node.js**: Version 14 or higher
- **npm**: Version 6 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended for performance tests)
- **Disk Space**: 500MB for dependencies and test artifacts

#### Port Configuration
- **Backend Server**: `http://localhost:5000` (required for performance tests)
- **MongoDB**: In-memory (no external port required for unit/integration tests)

### Coverage Configuration

#### Coverage Collection
- **Source Files**: `src/**/*.js`
- **Excluded Directories**: 
  - `src/config/**`
  - `src/routes/**`
- **Output Directory**: `coverage/`
- **Report Format**: HTML, JSON, and LCOV

#### Coverage Goals
- **Statement Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 85%
- **Line Coverage**: > 80%

### Mocking Strategy

#### External Dependencies Mocked
- **Email Services** (Nodemailer)
- **Payment Gateway** (Stripe)
- **Google OAuth** (Google APIs)
- **External APIs** (via axios mocks)

#### Mocking Example
```javascript
jest.mock('../../../src/models/MyModel');
jest.mock('nodemailer');
jest.mock('stripe');
```

### Test Isolation

#### Database Isolation
- Each test suite gets a fresh in-memory MongoDB instance
- Database is cleared after each test (`afterEach`)
- No test data persists between tests

#### Request Isolation
- Each integration test uses fresh HTTP requests
- Authentication tokens are generated per test
- No session pollution between tests

### Timeout Configuration

#### Default Timeout
- **Jest Timeout**: 30 seconds (configurable in jest.config.js)
- **Individual Test Timeout**: Can be overridden with `--testTimeout` flag

#### Increasing Timeout
```bash
npm test -- --testTimeout=10000  # 10 seconds
```

### Troubleshooting Common Issues

#### Test Timeout Errors
**Solution**: Increase timeout in `jest.config.js` or use `--testTimeout` flag

#### MongoDB Connection Errors
**Solution**: Ensure `mongodb-memory-server` is installed and compatible with Node.js version

#### Mock Not Working
**Solution**: Check that `jest.mock()` is called before imports

#### Coverage Not Generating
**Solution**: Ensure `collectCoverageFrom` paths are correct in `jest.config.js`

#### Performance Test Connection Refused
**Solution**: Ensure backend server is running on port 5000 before running performance tests

---

## Summary

This Testing Instruction Report provides comprehensive guidelines for:

1. **Unit Tests**: Using Jest with MongoDB Memory Server for isolated testing of models and controllers
2. **Integration Tests**: Using Supertest for end-to-end API testing with real HTTP requests
3. **Performance Tests**: Using Artillery.io for load testing and performance benchmarking
4. **Environment Configuration**: Detailed setup including Jest configuration, test environment setup, and system requirements

All tests are designed to be isolated, repeatable, and provide comprehensive coverage of the PeriodPal backend application.
