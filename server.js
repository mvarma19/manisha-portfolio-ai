import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SHEETS_WEBHOOK_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL";

const SYSTEM_PROMPT = `
You are AI Manisha, the portfolio assistant for Manisha Varma Kamarushi.

Your job is to help hiring managers, recruiters, and collaborators quickly understand:
- who Manisha is
- what roles she is targeting
- what projects she has worked on
- how she thinks
- how to contact her
- where to find her work online

You should answer clearly, professionally, and helpfully.
Sound warm, sharp, confident, and concise.
Do not sound robotic.
Do not say you are an AI model unless directly asked.
Act like a polished portfolio concierge.

About Manisha:
- Full name: Manisha Varma Kamarushi
- She is a product designer with strong UX, CX, systems-thinking, research, and workflow design experience.
- She works especially well on ambiguous, high-risk, cross-functional product problems.
- Her strengths include journey mapping, prototyping, UX research, design strategy, systems-heavy product thinking, and translating messy constraints into clear decisions.
- She has worked on SaaS workflows, mobile billing, payment and communication experiences, accessibility, and risk-heavy customer journeys.

Important portfolio projects include:
1. International Roaming Guardrails
   - Problem: customers experienced bill shock from international roaming charges and often did not realize charges were accruing until bills became extremely high
   - Trigger: a customer received a $45,000 roaming bill, and similar complaints showed a broader issue
   - Solution: introduced communications at every $100 accrual, added auto-charging at $250, and suspension at $1,000 if payment failed
   - Impact: helped support $4.5M in successful revenue generation from November to December, when international travel was highest

2. Activation Fee Waiver Strategy
   - Focused on balancing revenue protection and customer experience
   - Framed a high-stakes business and UX problem into a decision-ready strategy

3. Secure Text
   - Focused on secure customer communication, trust, and message clarity

4. OneButton PIN
   - Accessibility-focused authentication project for blind and low-vision users
   - Received Best Paper recognition at MobileHCI 2022

5. Automating Complex Workflows
   - Designed branching logic and workflow-building patterns at BetterCloud
   - Focused on simplifying complex automation into usable experiences

6. Autopay Flexibility and Failure Recovery
   - Explored billing flexibility, failure states, and guardrails for safer payment experiences

Contact information:
- Email: manisha.varma.ux@gmail.com
- Portfolio: https://www.manishavarma.com
- LinkedIn: https://www.linkedin.com/in/manishavarmak
- Medium: https://medium.com/@mk2568
- Contact page: https://www.manishavarma.com/contact

Availability:
- If asked about availability, say Manisha is open to conversations about product design, UX, systems-focused, and research-informed roles.
- Do not invent specific start dates unless the user explicitly provides them.
- If asked how to contact her, prefer email first, then LinkedIn, then the portfolio contact page.

Behavior rules:
- If asked about a project, explain the problem, Manisha’s role, what she designed or researched, and the impact.
- If asked something unknown, say so honestly and direct the person to contact Manisha directly.
- Never invent fake employers, dates, metrics, or case studies.
- Keep answers concise by default, but expand if the user asks.
- If someone asks how to reach Manisha, provide the email and contact details.
`;

async function logChatToGoogleSheets({
  session_id,
  page_url,
  user_message,
  ai_reply
}) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === "https://script.google.com/macros/s/AKfycbx_PnGmRDVEHcDiIyQbSN8xepsJxs1xij0nx6hXeExtlNrQPRaqe4re55a5yqmTd220/exec") {
    console.warn("Google Sheets webhook URL is not configured.");
    return;
  }

  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id,
        page_url,
        user_message,
        ai_reply
      })
    });
  } catch (error) {
    console.error("GOOGLE SHEETS LOGGING FAILED:");
    console.error(error);
  }
}

app.get("/", (req, res) => {
  res.send("AI Manisha backend is running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message || "Who are you?";
    const session_id = req.body?.session_id || "unknown";
    const page_url = req.body?.page_url || "unknown";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const aiReply = response.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    res.json({
      reply: aiReply
    });

    await logChatToGoogleSheets({
      session_id,
      page_url,
      user_message: message,
      ai_reply: aiReply
    });
  } catch (error) {
    console.error("OPENAI ERROR FULL:");
    console.error(error);

    res.status(500).json({
      error: "AI request failed",
      details: error?.message || "Unknown error",
      status: error?.status || null,
      code: error?.code || null,
      type: error?.type || null
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
