const http = require("http");

const productId = "6995e374663ea3695e6de8fb"; // Sanitary Napkins Pack
let orderId = null;

// Test 1: Checkout
function testCheckout() {
  console.log("\n=== Test 1: Checkout ===");
  
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/orders/checkout",
    method: "POST",
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
      const response = JSON.parse(data);
      console.log("Response:");
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success && response.order) {
        orderId = response.order._id;
        console.log("\n✓ Checkout successful!");
        console.log("  Order ID:", orderId);
        console.log("  Items:", response.order.items.length);
        console.log("  Total: $" + response.order.total.toFixed(2));
        console.log("  Status:", response.order.orderStatus);
        
        // Continue to Test 2
        setTimeout(() => testUpdateContact(), 1000);
      } else {
        console.log("✗ Checkout failed:", response.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error.message);
  });

  req.end();
}

// Test 2: Update contact info
function testUpdateContact() {
  console.log("\n=== Test 2: Update Contact Info ===");
  
  const contactData = JSON.stringify({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "555-1234"
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: `/api/orders/${orderId}/contact`,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": contactData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = "";
    console.log("Status Code:", res.statusCode);
    
    res.on("data", (chunk) => {
      data += chunk;
    });
    
    res.on("end", () => {
      const response = JSON.parse(data);
      
      if (response.success && response.order) {
        console.log("✓ Contact info updated!");
        console.log("  Name:", response.order.contactInfo.firstName, response.order.contactInfo.lastName);
        console.log("  Email:", response.order.contactInfo.email);
        console.log("  Phone:", response.order.contactInfo.phone);
        
        // Continue to Test 3
        setTimeout(() => testPayOrder(), 1000);
      } else {
        console.log("✗ Update failed:", response.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error.message);
  });

  req.write(contactData);
  req.end();
}

// Test 3: Pay for order
function testPayOrder() {
  console.log("\n=== Test 3: Pay Order ===");
  
  const options = {
    hostname: "localhost",
    port: 5000,
    path: `/api/orders/${orderId}/pay`,
    method: "POST",
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
      const response = JSON.parse(data);
      
      if (response.success && response.order) {
        console.log("✓ Order paid successfully!");
        console.log("  Order Status:", response.order.orderStatus);
        console.log("  Payment Status:", response.order.payment.status);
        console.log("  Transaction ID:", response.order.payment.transactionId);
        
        // Continue to Test 4
        setTimeout(() => testGetOrder(), 1000);
      } else {
        console.log("✗ Payment failed:", response.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error.message);
  });

  req.end();
}

// Test 4: Get order details
function testGetOrder() {
  console.log("\n=== Test 4: Get Order Details ===");
  
  const options = {
    hostname: "localhost",
    port: 5000,
    path: `/api/orders/${orderId}`,
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
      const response = JSON.parse(data);
      console.log("Response:");
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success && response.order) {
        console.log("\n✓ Order retrieved successfully!");
        console.log("  Order ID:", response.order._id);
        console.log("  Subtotal: $" + response.order.subtotal.toFixed(2));
        console.log("  Total: $" + response.order.total.toFixed(2));
        console.log("  Status:", response.order.orderStatus);
      } else {
        console.log("✗ Get order failed:", response.message);
      }
      
      console.log("\n=== All Order Tests Completed ===\n");
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error.message);
  });

  req.end();
}

// Start tests
console.log("Starting order tests...");
console.log("Product ID:", productId);
testCheckout();
