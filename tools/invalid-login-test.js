const https = require("https");

const payload = JSON.stringify({
  email: "noone@example.com",
  password: "wrongpassword",
});

const options = {
  hostname: "smartresume-ai-analyzer-job-matcher-1.onrender.com",
  port: 443,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log("HEADERS:", JSON.stringify(res.headers, null, 2));
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    try {
      console.log("BODY:", JSON.parse(data));
    } catch (e) {
      console.log("BODY:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("Request failed:", e.message);
});

req.write(payload);
req.end();
