const http = require("http");

const product = {
  name: "Sanitary Napkins Pack",
  category: "Period Care",
  price: 9.99,
  stockQty: 100,
  description: "Soft and comfortable sanitary napkins with waterproof backing",
  priorityTag: "HIGH"
};

const data = JSON.stringify(product);

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/products",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = "";
  console.log("Status Code:", res.statusCode);
  
  res.on("data", (chunk) => {
    responseData += chunk;
  });
  
  res.on("end", () => {
    console.log("\nResponse:");
    const parsed = JSON.parse(responseData);
    console.log(JSON.stringify(parsed, null, 2));
    
    if (parsed.success && parsed.product) {
      console.log("\n✓ Product added successfully!");
      console.log("  ID:", parsed.product._id);
      console.log("  Name:", parsed.product.name);
      console.log("  Price:", parsed.product.price);
      console.log("  Stock:", parsed.product.stockQty);
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.write(data);
req.end();
