const http = require("http");

// First get the product ID from the database
const productId = "6995e374663ea3695e6de8fb"; // From our previous product creation

const addData = JSON.stringify({
  productId: productId,
  qty: 2
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/cart/items",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": addData.length
  }
};

console.log("Testing POST /api/cart/items...\n");
console.log("Adding product:", productId);
console.log("Quantity: 2\n");

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
      
      if (response.success && response.cart && response.cart.items) {
        console.log("\n✓ Product added to cart successfully!");
        console.log(`  Items in cart: ${response.cart.items.length}`);
      }
    } catch (e) {
      console.log("Response:", data);
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.write(addData);
req.end();
