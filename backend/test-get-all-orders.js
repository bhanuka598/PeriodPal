const http = require("http");

console.log("Testing GET /api/orders (get all orders)...\n");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/orders",
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
};

const req = http.request(options, (res) => {
  let data = "";
  console.log("Status Code:", res.statusCode);
  
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      console.log("\nResponse:");
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log("\n✓ Get all orders successful!");
        console.log(`  Total orders: ${response.count}`);
        
        if (response.orders && response.orders.length > 0) {
          console.log("\nOrder List:");
          response.orders.forEach((order, idx) => {
            console.log(`  ${idx + 1}. Order ID: ${order._id}`);
            console.log(`     Status: ${order.orderStatus}`);
            console.log(`     Total: $${order.total.toFixed(2)}`);
            console.log(`     Items: ${order.items.length}`);
            console.log(`     Created: ${new Date(order.createdAt).toLocaleDateString()}`);
          });
        } else {
          console.log("\n  No orders found");
        }
      } else {
        console.log("✗ Failed:", response.message);
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
