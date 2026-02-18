const http = require("http");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/cart/summary",
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
};

console.log("Testing GET /api/cart/summary...\n");

const req = http.request(options, (res) => {
  let data = "";
  
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log("\nResponse:");
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success && response.summary) {
        console.log("\n✓ Cart Summary:");
        console.log(`  Subtotal: $${response.summary.subtotal.toFixed(2)}`);
        console.log(`  Shipping: $${response.summary.shipping.toFixed(2)}`);
        console.log(`  Tax:      $${response.summary.tax.toFixed(2)}`);
        console.log(`  Total:    $${response.summary.total.toFixed(2)}`);
      }
    } catch (e) {
      console.log("Response:", data);
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.end();
