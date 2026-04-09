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
```

## Coverage Summary

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

## Key Testing Concepts

1. **Isolation**: Each test runs with a clean database state (MongoDB Memory Server)
2. **Mocking**: External dependencies (email services, Stripe, APIs) are mocked
3. **Coverage**: Tests cover:
   - Success scenarios (happy paths)
   - Validation errors (missing/invalid data)
   - Business logic edge cases
   - Error handling and server errors
   - Security scenarios (unauthorized access)

## Running Specific Test Files

```bash
# Test specific model
npm test -- MenstrualRecord.test.js

# Test specific controller
npm test -- authController.test.js

# Test with pattern
npm test -- --testNamePattern="should create"

# Run only failed tests
npm test -- --onlyFailures
```

## Adding New Tests

1. Create test file in appropriate `tests/unit/` subdirectory
2. Import the module being tested
3. Mock external dependencies using `jest.mock()`
4. Write test cases using `describe()` and `it()` blocks
5. Use `beforeEach()` to reset state between tests

### Example Test Pattern

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
