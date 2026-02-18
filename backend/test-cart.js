const http = require("http");

// Test GET /api/cart (should fail - no req.user)
console.log("Testing GET /api/cart...\n");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/cart",
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
};

const req = http.request(options, (res) => {
  let data = "";
  
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:");
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.end();
