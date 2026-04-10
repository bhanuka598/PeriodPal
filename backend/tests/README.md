# Backend Unit Testing Guide

## Setup

Tests are configured using Jest with MongoDB Memory Server for isolated database testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.js                          # Test environment setup
├── README.md                         # This documentation
├── unit/
│   ├── models/                       # Model unit tests (7 models)
│   │   ├── Cart.test.js              # Cart model tests
│   │   ├── Inventory.test.js         # Inventory model tests
│   │   ├── MenstrualRecord.test.js   # MenstrualRecord model tests
│   │   ├── Order.test.js             # Order model tests
│   │   ├── OTP.test.js               # OTP model tests
│   │   ├── Product.test.js           # Product model tests
│   │   └── User.test.js              # User model tests
│   └── controllers/                  # Controller unit tests (9 controllers)
│       ├── authController.test.js    # Auth controller tests
│       ├── cartController.test.js    # Cart controller tests
│       ├── forgotPasswordController.test.js  # Forgot password tests
│       ├── inventoryController.test.js # Inventory controller tests
│       ├── menstrualRecordController.test.js  # Menstrual record controller tests
│       ├── orderController.test.js   # Order controller tests
│       ├── otpController.test.js     # OTP controller tests
│       ├── productController.test.js # Product controller tests
│       └── userController.test.js    # User controller tests
│   └── integration/                   # Integration tests (8 test suites)
│       ├── setup.js                  # Integration test environment setup
│       ├── auth.integration.test.js   # Auth API integration tests
│       ├── product.integration.test.js    # Product API integration tests
│       ├── cart.integration.test.js       # Cart API integration tests
│       ├── order.integration.test.js      # Order API integration tests
│       ├── user.integration.test.js       # User API integration tests
│       ├── menstrualRecord.integration.test.js  # Menstrual record API integration tests
│       └── inventory.integration.test.js      # Inventory API integration tests
```

## Coverage Summary

### Unit Tests
### Models (7 total)
- **Cart**: Schema validation, item validation, status enum, CRUD operations
- **Inventory**: Stock validation, unique constraints, location indexing
- **MenstrualRecord**: Date validation, flow intensity enum, symptoms array
- **Order**: Price validation, payment status enum, order status tracking
- **OTP**: Expiration, purpose enum, verification workflow
- **Product**: Price/stock validation, priority tag enum, category filtering
- **User**: Password hashing, email validation, role enum

### Controllers (9 total)
- **authController**: Register, login, demo login, password validation
- **cartController**: Add/remove items, merge guest cart, cart summary
- **forgotPasswordController**: OTP generation, verification, password reset
- **inventoryController**: CRUD, stock adjustment, geocoding
- **menstrualRecordController**: CRUD, email reminders, admin analytics
- **orderController**: Checkout, payment, contact update, donor analytics
- **otpController**: Send, verify, resend OTP with rate limiting
- **productController**: CRUD, image upload, search/filter
- **userController**: Profile management, admin user management

### Integration Tests (8 total)
- **Auth API**: Full auth flow (register, login, get profile), error scenarios, token validation
- **Product API**: CRUD operations with authentication, filtering, search, validation errors
- **Cart API**: Add/remove items, guest cart, cart merge, summary calculations
- **Order API**: Complete checkout flow, payment processing, stock updates, contact management
- **User API**: Profile management, password updates, admin operations (CRUD users)
- **Menstrual Record API**: CRUD operations, date validation, email reminders, analytics
- **Inventory API**: CRUD operations, stock adjustments, filtering, geocoding

## Key Testing Concepts

### Unit Testing
1. **Isolation**: Each test runs with a clean database state (MongoDB Memory Server)
2. **Mocking**: External dependencies (email services, Stripe, APIs) are mocked
3. **Coverage**: Tests cover:
   - Success scenarios (happy paths)
   - Validation errors (missing/invalid data)
   - Business logic edge cases
   - Error handling and server errors
   - Security scenarios (unauthorized access)

### Integration Testing
1. **End-to-End API Testing**: Tests actual HTTP requests through the full Express application
2. **Database Integration**: Real MongoDB operations with in-memory database
3. **Authentication Flow**: Tests complete auth flows (register → login → protected routes)
4. **Multi-Resource Workflows**: Tests interactions between different resources (cart → order → payment)
5. **Error Scenarios**: Tests validation errors, unauthorized access, and edge cases
6. **Guest vs Authenticated Users**: Tests both guest and authenticated user flows

## Running Specific Test Files

```bash
# Test specific model (unit)
npm test -- MenstrualRecord.test.js

# Test specific controller (unit)
npm test -- authController.test.js

# Test specific integration suite
npm test -- auth.integration.test.js
npm test -- product.integration.test.js
npm test -- cart.integration.test.js
npm test -- order.integration.test.js
npm test -- user.integration.test.js
npm test -- menstrualRecord.integration.test.js
npm test -- inventory.integration.test.js

# Run only unit tests
npm test -- --testPathPattern="unit/"

# Run only integration tests
npm test -- --testPathPattern="integration/"

# Test with pattern
npm test -- --testNamePattern="should create"

# Run only failed tests
npm test -- --onlyFailures
```

## Adding New Tests

### Unit Tests
1. Create test file in appropriate `tests/unit/` subdirectory
2. Import the module being tested
3. Mock external dependencies using `jest.mock()`
4. Write test cases using `describe()` and `it()` blocks
5. Use `beforeEach()` to reset state between tests

### Integration Tests
1. Create test file in `tests/integration/` directory
2. Import the app from `./setup` and required models
3. Write test cases that make actual HTTP requests using supertest
4. Use `beforeEach()` to create test data and `afterEach()` for cleanup
5. Test complete flows (e.g., register → login → get profile)
6. Include error scenarios (invalid data, unauthorized access, etc.)

### Example Test Pattern

#### Unit Test Example
```javascript
const controller = require('../../../src/controllers/myController');
const Model = require('../../../src/models/MyModel');

jest.mock('../../../src/models/MyModel');

describe('MyController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    req.body = { name: 'Test' };
    Model.find.mockResolvedValue([]);

    // Act
    await controller.myFunction(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
```

#### Integration Test Example
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

## Test Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Run with coverage report |
| `npm test -- --verbose` | Show detailed output |
| `npm test -- --silent` | Suppress console output |
| `npm test -- --testTimeout=10000` | Increase timeout to 10s |
| `npm test -- --maxWorkers=2` | Limit parallel workers |

## Troubleshooting

**Test timeout errors**: Increase timeout in `jest.config.js` or use `--testTimeout` flag

**MongoDB connection errors**: Ensure `mongodb-memory-server` is installed

**Mock not working**: Check that `jest.mock()` is called before imports

**Coverage not generating**: Ensure `collectCoverageFrom` paths are correct in `jest.config.js`
