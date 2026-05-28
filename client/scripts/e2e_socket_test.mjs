import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { io } from "socket.io-client";

const API =
  process.env.API_BASE ||
  "https://smartresume-ai-analyzer-job-matcher-2.onrender.com";

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  try {
    console.log("Logging in as admin...");
    const loginRes = await axios.post(`${API}/api/auth/login`, {
      email: "admin@smartresume.dev",
      password: "Admin12345!",
    });
    const { accessToken } = loginRes.data;
    console.log("Got token");

    const socket = io(API, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("Socket connected", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    socket.on("dashboard:update", (d) => console.log("dashboard:update", d));
    socket.on("notification:new", (n) => console.log("notification:new", n));

    // upload resume
    const form = new FormData();
    form.append(
      "resume",
      fs.createReadStream(new URL("./test-resume.txt", import.meta.url)),
    );

    console.log("Uploading resume...");
    const uploadRes = await axios.post(`${API}/api/resumes/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const resume = uploadRes.data.resume;
    console.log("Uploaded resume", resume._id);

    // analyze
    const jd =
      "This is a sample job description that is intentionally long to pass validation. It includes responsibilities and required skills for a software engineer role in a fast-paced team.";
    console.log("Requesting analysis...");
    const analyzeRes = await axios.post(
      `${API}/api/analyses`,
      {
        resumeId: resume._id,
        roleTitle: "Software Engineer",
        company: "Example Corp",
        jobDescription: jd,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    console.log("Analysis response received", analyzeRes.data.analysis?._id);

    // wait for socket events to arrive
    console.log("Waiting up to 8s for socket events...");
    await wait(8000);

    socket.disconnect();
    console.log("Done.");
  } catch (err) {
    console.error(
      "E2E script error",
      err?.response?.data || err.message || err,
    );
    process.exit(1);
  }
}

main();
