# Performance Testing with Artillery.io

This directory contains performance test configurations for the PeriodPal backend API using Artillery.io.

## Prerequisites

1. Ensure the backend server is running on `http://localhost:5000`
2. Install Artillery: `npm install --save-dev artillery` (already installed)

## Test Scenarios

### 1. Baseline Load Test (`baseline-load-test.yml`)
Tests the API under normal load conditions:
- Warm up: 10 requests/sec for 60 seconds
- Sustained load: 20 requests/sec for 120 seconds
- Cool down: 10 requests/sec for 60 seconds
- Tests public endpoints (health check, products)

**Run:** `npm run perf:baseline`

### 2. Stress Load Test (`stress-load-test.yml`)
Tests the API under high load to find breaking points:
- Initial load: 50 requests/sec for 60 seconds
- High load: 100 requests/sec for 120 seconds
- Peak stress: 200 requests/sec for 60 seconds
- Recovery: 50 requests/sec for 60 seconds

**Run:** `npm run perf:stress`

### 3. Spike Load Test (`spike-load-test.yml`)
Tests how the API handles sudden traffic spikes:
- Normal traffic: 10 requests/sec for 30 seconds
- Spike: 500 requests/sec for 30 seconds
- Recovery: 10 requests/sec for 60 seconds

**Run:** `npm run perf:spike`

### 4. Authenticated Load Test (`authenticated-load-test.yml`)
Tests authenticated user flows:
- Warm up: 5 requests/sec for 60 seconds
- Sustained load: 15 requests/sec for 120 seconds
- Cool down: 5 requests/sec for 60 seconds
- Tests login, profile, and orders endpoints

**Run:** `npm run perf:auth`

## Running Tests

### Start the Backend Server
```bash
npm run dev
```

### Run Performance Tests
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

## Understanding Results

Artillery provides detailed metrics including:
- **Response Time:** p95, p99, min, max, median
- **Request Count:** Total requests, successful, failed
- **Throughput:** Requests per second (RPS)
- **Error Rate:** Percentage of failed requests

### Key Metrics to Monitor
- **p95 Response Time:** 95% of requests complete within this time (aim for < 500ms)
- **p99 Response Time:** 99% of requests complete within this time (aim for < 1s)
- **Error Rate:** Should be 0% for stable performance
- **RPS:** Requests per second the API can handle

## Generating HTML Reports

After running a test, generate an HTML report:
```bash
npm run perf:report
```

This creates `performance-report.html` with detailed visualizations.

## Customizing Tests

### Modify Load Patterns
Edit the `phases` section in each YAML file:
```yaml
phases:
  - duration: 60        # Duration in seconds
    arrivalRate: 10     # Requests per second
    name: "Phase name"
```

### Add New Endpoints
Add new flow steps to the `scenarios` section:
```yaml
flow:
  - get:
      url: "/api/endpoint"
      name: "Endpoint Name"
      expect:
        - statusCode: 200
```

### Test with Authentication
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

## Best Practices

1. **Run tests during off-peak hours** to avoid affecting production
2. **Monitor system resources** (CPU, memory, disk I/O) during tests
3. **Test against a staging environment** that mirrors production
4. **Compare results over time** to detect performance regressions
5. **Set up alerts** for performance degradation in production

## Troubleshooting

### Connection Refused
Ensure the backend server is running on port 5000.

### High Error Rates
- Check if the API endpoints are correctly configured
- Verify authentication tokens are valid
- Ensure the database is accessible

### Slow Response Times
- Check database query performance
- Verify server resources (CPU, memory)
- Review middleware and authentication logic

## Additional Resources

- [Artillery Documentation](https://artillery.io/docs/)
- [Express.js Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
