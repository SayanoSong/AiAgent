import express from "express";
import { PrismaClient } from "../generated/prisma";
import { sendEmail } from "../util/mailer";
import { setTimeout as delay } from "timers/promises";
const prisma = new PrismaClient();
const router = express.Router();

//Mock Request and Data
const pendingTimers = new Map<number, NodeJS.Timeout>();
const generatedData = new Map<number, string>();
const generateMockData = () => ({
  typeOfConsultation: "Medical",
  country: "United States",
  language: "English",
  urgencyLevel: "High",
  address: "123 Main Street, New York, NY",
});

router.post("/submit", async (req, res) => {
  const { email, phone } = req.body;

  if (!email || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "Empty Email or Phone" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { phone } });

    if (existing) {
      console.log(`Existed: ${email}`);
      //return res.status(200).json({ success: true, message: "该手机号已注册" });
    }
    if (!existing) {
      const newUser = await prisma.user.create({
        data: {
          email,
          phone,
          data: "",
        },
      });
      await fetch(`http://localhost:3001/api/form/create-agent/${newUser.id}`, {
        method: "POST",
      });
      for (let i = 0; i < 10; i++) {
        const response = await fetch(
          `http://localhost:3001/api/form/get-user-info/${newUser.id}`
        );
        const result = await response.json();

        if (result.status === 1 && result.data) {
          await prisma.user.update({
            where: { id: newUser.id },
            data: { data: JSON.stringify(result.data) },
          });
          console.log(`User ${newUser.id} data updated.`);
          break;
        }

        // Wait 5 seconds before next try
        await delay(5000);
      }

      await sendEmail({
        to: email,
        subject: "Sign Up Success",
        text: `Thank you for Sign Up! You can check your information on: http://localhost:3001/api/form/user/${newUser.id}`,
      });
    } else {
      await fetch(
        `http://localhost:3001/api/form/create-agent/${existing.id}`,
        {
          method: "POST",
        }
      );
      for (let i = 0; i < 10; i++) {
        const response = await fetch(
          `http://localhost:3001/api/form/get-user-info/${existing.id}`
        );
        const result = await response.json();

        if (result.status === 1 && result.data) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { data: JSON.stringify(result.data) },
          });
          console.log(`User ${existing.id} data updated.`);
          break;
        }

        // Wait 5 seconds before next try
        await delay(5000);
      }
      await sendEmail({
        to: email,
        subject: "Sign Up Success",
        text: `Signed Up! Check your information on: http://localhost:3001/api/form/user/${existing.id}`,
      });
    }

    return res.json({ success: true, message: "Confirmation Email Sent" });
  } catch (err) {
    console.error("Sign Error: ", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/create-agent/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }

  if (pendingTimers.has(userId)) {
    return res.json({ success: true, message: "Task is already running." });
  }

  const timer = setTimeout(async () => {
    const data = generateMockData();

    generatedData.set(userId, JSON.stringify(data));
    console.log(`Generated data for user ${userId}.`);

    pendingTimers.delete(userId);
  }, 30000);

  pendingTimers.set(userId, timer);

  res.json({
    success: true,
    message: "AI agent started. Data will be ready in 30 seconds.",
  });
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).send(`<h3>User ID ${id} No Found</h3>`);
    }

    let dataRows = "";

    try {
      const parsedData = user.data ? JSON.parse(user.data) : {};
      if (typeof parsedData === "object" && parsedData !== null) {
        for (const [key, value] of Object.entries(parsedData)) {
          dataRows += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
      } else {
        dataRows = "<tr><td colspan='2'>No structured data available</td></tr>";
      }
    } catch (err) {
      dataRows = "<tr><td colspan='2'>Invalid data format</td></tr>";
    }

    const html = `
      <html>
        <head><title>User Info</title></head>
        <body>
          <table border="1" cellpadding="8">
            <thead>
              <tr><th colspan="2">Phone: ${user.phone}</th></tr>
            </thead>
            <tbody>
              <tr><td>Email</td><td>${user.email}</td></tr>
              <tr><td colspan="2"><b>Data</b></td></tr>
              ${dataRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Searching Error: ", error);
    res.status(500).send("Server Error");
  }
});

router.get("/get-user-info/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const userData = generatedData.get(userId);

    if (!userData) {
      return res.json({
        status: 0,
        data: {},
        message: "Data is still being generated. Please try again later.",
      });
    }

    return res.json({
      status: 1,
      data: JSON.parse(userData),
    });
  } catch (err) {
    console.error("Failed to fetch user info:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;
