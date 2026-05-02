# INSTRUCTIONS.md
# AI Sentiment Intelligence Platform — Brooks Running

You are building a full-stack sentiment analysis simulation system. Read this entire file before writing a single line of code. Follow the architecture, schema, and algorithm exactly as specified.

---

## Project Overview

A tool that simulates what a real consumer sees when they query an AI assistant about running shoes. The user enters a prompt, the backend calls the OpenAI API (mimicking a ChatGPT query), and the system analyzes the response for two things:

1. **Visibility** — did each brand appear? how many times? in what position?
2. **Sentiment** — when a brand appears, how is it described? score it -1 to +1.

**Brands to track:** Brooks Running (client), Nike, Adidas, Hoka

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React + TypeScript (Vite)   |
| Backend  | Node.js + TypeScript (Express) |
| Database | PostgreSQL                  |
| ORM      | Prisma                      |
| AI       | OpenAI Responses API        |

---

## Repo Structure

```
/
├── frontend/          # React + TypeScript (Vite)
│   └── src/
│       ├── components/
│       │   ├── PromptInput.tsx
│       │   ├── SimulationResults.tsx
│       │   ├── BrandScoreCard.tsx
│       │   └── SimulationHistory.tsx
│       ├── api/
│       │   └── client.ts
│       └── App.tsx
│
├── backend/           # Node.js + TypeScript (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   └── simulation.ts
│   │   ├── services/
│   │   │   ├── openai.ts         # OpenAI API call
│   │   │   ├── visibility.ts     # Brand detection engine
│   │   │   └── sentiment.ts      # Hybrid sentiment engine
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
│
├── .env               # API keys (never expose to frontend)
└── README.md
```

---

## Environment Variables

Create a `.env` file at the project root. **Never expose these to the frontend.**

```env
DATABASE_URL=postgresql://localhost:5432/sentiment_db
OPENAI_API_KEY=<provided key>
OPENAI_MODEL=<provided model name>   # hidden from client at all times
PORT=3001
```

---

## Database Schema (Prisma)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Simulation {
  id           String        @id @default(uuid())
  prompt       String
  rawResponse  String
  createdAt    DateTime      @default(now())
  brandResults BrandResult[]
}

model BrandResult {
  id                 String           @id @default(uuid())
  simulationId       String
  simulation         Simulation       @relation(fields: [simulationId], references: [id])
  brandName          String           // "Brooks" | "Nike" | "Adidas" | "Hoka"
  isVisible          Boolean
  mentionCount       Int              @default(0)
  firstMentionIndex  Int?             // character index in raw response
  sentimentScore     Float?           // -1.0 to 1.0
  sentimentLabel     String?          // "positive" | "mixed" | "negative"
  scoringMethod      String?          // "rule-based" | "llm" | "hybrid"
  attributes         BrandAttribute[]
}

model BrandAttribute {
  id            String      @id @default(uuid())
  brandResultId String
  brandResult   BrandResult @relation(fields: [brandResultId], references: [id])
  text          String      // e.g. "comfortable", "expensive"
  sentiment     String      // "positive" | "negative" | "neutral"
}
```

---

## API Endpoints

### `POST /api/simulations`
Accepts a user prompt, runs the full analysis pipeline, persists results, and returns structured data.

**Request body:**
```json
{ "prompt": "What are the best running shoes for marathon training?" }
```

**Response:**
```json
{
  "simulationId": "uuid",
  "prompt": "...",
  "rawResponse": "...",
  "createdAt": "ISO timestamp",
  "brandResults": [
    {
      "brandName": "Brooks",
      "isVisible": true,
      "mentionCount": 2,
      "firstMentionIndex": 142,
      "sentimentScore": 0.72,
      "sentimentLabel": "positive",
      "scoringMethod": "rule-based",
      "attributes": [
        { "text": "high quality", "sentiment": "positive" },
        { "text": "comfortable", "sentiment": "positive" },
        { "text": "pricey", "sentiment": "negative" }
      ]
    }
  ]
}
```

### `GET /api/simulations`
Returns all past simulations, ordered by `createdAt` descending.

### `GET /api/simulations/:id`
Returns a single simulation with full brand results and attributes.

---

## Core Logic

### Step 1 — OpenAI Call (`services/openai.ts`)

Call the OpenAI Responses API with a neutral system prompt to simulate a real consumer query. **The model name must come from `process.env.OPENAI_MODEL` and must never be sent to the frontend.**

```typescript
// Neutral system prompt — do not hint at analysis
const systemPrompt = `You are a helpful assistant. Answer the user's question naturally and conversationally.`;

const response = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL!,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]
});

return response.choices[0].message.content;
```

---

### Step 2 — Visibility Engine (`services/visibility.ts`)

Run after receiving the raw response text.

```typescript
const BRANDS = ["Brooks", "Nike", "Adidas", "Hoka"];

function checkVisibility(responseText: string): VisibilityResult[] {
  return BRANDS.map(brand => {
    const regex = new RegExp(brand, "gi");
    const matches = [...responseText.matchAll(regex)];
    const firstIndex = matches.length > 0 ? matches[0].index : null;

    return {
      brandName: brand,
      isVisible: matches.length > 0,
      mentionCount: matches.length,
      firstMentionIndex: firstIndex ?? null
    };
  });
}
```

---

### Step 3 — Hybrid Sentiment Engine (`services/sentiment.ts`)

This is the most important part of the codebase. Two passes in order.

#### 3a — Extract brand passages

For each brand that is visible, extract the sentence(s) surrounding every mention.

```typescript
function extractBrandPassages(text: string, brand: string): string[] {
  // Split into sentences on . ! ?
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.filter(s => 
    s.toLowerCase().includes(brand.toLowerCase())
  );
}
```

#### 3b — Pass 1: Rule-based scoring

Use the `sentiment` npm package (AFINN-based) to score each passage. Scores are normalized to -1 to +1.

```typescript
import Sentiment from "sentiment";
const analyzer = new Sentiment();

function ruleBasedScore(passage: string): number {
  const result = analyzer.analyze(passage);
  // Normalize: AFINN scores typically range -5 to +5 per word
  // Clamp to -1 / +1
  return Math.max(-1, Math.min(1, result.comparative));
}
```

#### 3c — Pass 2: LLM fallback for ambiguous cases

If the rule-based score falls within the neutral band (±0.2), OR if the passage contains comparative/contextual language, escalate to a second OpenAI call.

**Ambiguity triggers:**
- Score is between -0.2 and +0.2
- Passage contains words like: "but", "however", "although", "compared to", "better for", "worse for", "depends"

```typescript
async function llmSentimentScore(brand: string, passage: string): Promise<LLMSentimentResult> {
  const prompt = `
Analyze the sentiment of the following passage about "${brand}" in the context of running shoes.

Passage: "${passage}"

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "score": <number between -1.0 and 1.0>,
  "label": "<positive|negative|neutral|mixed>",
  "attributes": [
    { "text": "<attribute>", "sentiment": "<positive|negative|neutral>" }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });

  const raw = response.choices[0].message.content || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
```

#### 3d — Aggregate per brand

Combine scores across all passages for a brand into a final score.

```typescript
function aggregateScores(passageScores: number[]): number {
  if (passageScores.length === 0) return 0;
  const avg = passageScores.reduce((a, b) => a + b, 0) / passageScores.length;
  return Math.round(avg * 100) / 100;
}

function scoreToLabel(score: number): string {
  if (score >= 0.2) return "positive";
  if (score <= -0.2) return "negative";
  return "mixed";
}
```

#### 3e — Full sentiment pipeline (tie it together)

```typescript
async function analyzeSentiment(responseText: string, brand: string): Promise<SentimentResult> {
  const passages = extractBrandPassages(responseText, brand);
  if (passages.length === 0) return null;

  const passageScores: number[] = [];
  const allAttributes: BrandAttribute[] = [];
  let method = "rule-based";

  for (const passage of passages) {
    const ruleScore = ruleBasedScore(passage);
    const isAmbiguous = Math.abs(ruleScore) <= 0.2 || isContextual(passage);

    if (isAmbiguous) {
      // LLM fallback
      const llmResult = await llmSentimentScore(brand, passage);
      passageScores.push(llmResult.score);
      allAttributes.push(...llmResult.attributes);
      method = "hybrid";
    } else {
      passageScores.push(ruleScore);
      // Extract attributes from rule-based passage
      const attrs = extractRuleAttributes(passage, ruleScore);
      allAttributes.push(...attrs);
    }
  }

  const finalScore = aggregateScores(passageScores);

  return {
    sentimentScore: finalScore,
    sentimentLabel: scoreToLabel(finalScore),
    scoringMethod: method,
    attributes: deduplicateAttributes(allAttributes).slice(0, 5)
  };
}

function isContextual(passage: string): boolean {
  const contextualWords = ["but", "however", "although", "compared", "better for", "worse for", "depends"];
  return contextualWords.some(w => passage.toLowerCase().includes(w));
}
```

---

### Step 4 — Orchestration (`routes/simulation.ts`)

Wire the pipeline together in the POST endpoint.

```typescript
router.post("/", async (req, res) => {
  const { prompt } = req.body;

  // 1. Call OpenAI
  const rawResponse = await callOpenAI(prompt);

  // 2. Run visibility check
  const visibilityResults = checkVisibility(rawResponse);

  // 3. Run sentiment analysis for visible brands only
  const brandResults = await Promise.all(
    visibilityResults.map(async (v) => {
      if (!v.isVisible) return { ...v, sentimentScore: null, sentimentLabel: null, attributes: [] };
      const sentiment = await analyzeSentiment(rawResponse, v.brandName);
      return { ...v, ...sentiment };
    })
  );

  // 4. Persist to Postgres
  const simulation = await prisma.simulation.create({
    data: {
      prompt,
      rawResponse,
      brandResults: {
        create: brandResults.map(b => ({
          brandName: b.brandName,
          isVisible: b.isVisible,
          mentionCount: b.mentionCount,
          firstMentionIndex: b.firstMentionIndex,
          sentimentScore: b.sentimentScore,
          sentimentLabel: b.sentimentLabel,
          scoringMethod: b.scoringMethod,
          attributes: { create: b.attributes }
        }))
      }
    },
    include: { brandResults: { include: { attributes: true } } }
  });

  res.json(simulation);
});
```

---

## Frontend Requirements

Keep it functional. Three views:

### View 1 — Prompt Input
- Text area for the user prompt
- 3 suggested prompts as quick-select chips (e.g. "Best shoes for marathon training", "Most durable running shoes", "Best value running shoes 2025")
- "Run Simulation" button
- Loading state while the backend processes

### View 2 — Simulation Results
Show immediately after a simulation completes.

- The original prompt at the top
- 4 brand cards side by side (Brooks, Nike, Adidas, Hoka)
  - Sentiment score + label
  - Visibility: "mentioned #2" or "not mentioned"
  - Attribute tags: green for positive, red for negative
- Raw AI response in a collapsible section at the bottom
- The scoring method used ("rule-based" / "hybrid") shown per brand

### View 3 — History
- List of all past simulations, newest first
- Each row: prompt text, Brooks' score, timestamp
- Click a row to expand and see full results

---

## Setup Instructions

```bash
# 1. Clone and install
npm install            # root (if monorepo) or cd into frontend/ and backend/ separately

# 2. Set up environment
cp .env.example .env
# Fill in OPENAI_API_KEY, OPENAI_MODEL, DATABASE_URL

# 3. Set up database
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 4. Run backend
npm run dev            # starts Express on PORT=3001

# 5. Run frontend
cd ../frontend
npm run dev            # starts Vite on PORT=5173
```

---

## Key Constraints

- `OPENAI_MODEL` and `OPENAI_API_KEY` must **never** appear in any frontend code, API response, or browser network request
- Every simulation must be persisted to Postgres before the response is returned
- Sentiment scoring method (`rule-based` vs `hybrid`) must be recorded per brand result so results are auditable
- The OpenAI system prompt must remain neutral — do not reference sentiment analysis, brands, or scoring in the system prompt
- Frontend should call `GET /api/simulations` on mount to populate history

---

## Dependencies to Install

**Backend:**
```bash
npm install express prisma @prisma/client openai sentiment dotenv cors
npm install -D typescript ts-node @types/express @types/node @types/sentiment nodemon
```

**Frontend:**
```bash
npm create vite@latest frontend -- --template react-ts
npm install axios
```
