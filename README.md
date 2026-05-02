# AI Sentiment Intelligence Platform
**Brooks Running · Competitive Analysis · v1.0**

---

## Overview

This is an open-ended 24-hour build. Show how you think, how you move 0→1,
and your technical depth — especially in backend logic. Take creative liberty.

Build a **sentiment analysis simulation system** for Brooks Running that mirrors
how a real user would query an AI assistant (like ChatGPT) when researching
running shoes. The system surfaces how Brooks — and its key competitors —
appear in AI-generated responses: whether they show up, how they're described,
and what sentiment those descriptions carry.

---

## Core Problem: Two Analytical Layers

### 1. Visibility
Did Brooks (or a competitor) appear in the AI response at all?
Use string matching to detect brand mentions.
> *"When someone searches for running shoes, am I in the conversation?"*

### 2. Sentiment of Description
When a brand appears, how is it described?
Extract attributes and score their sentiment.
> *"Nike is durable but expensive" → mixed*
> *"Brooks is high quality and affordable" → positive*

---

## Brands to Track
- **Brooks Running** (client)
- Nike
- Adidas
- Hoka

---

## How It Works

The user submits a natural language prompt (e.g. *"What are the best running
shoes for marathons?"*). The backend calls the OpenAI API — simulating a user
querying ChatGPT — and runs analysis on the returned text. The API key and
model name are hidden from the client. Results are stored in Postgres and
surfaced in the UI.

---

## Tech Stack

| Layer    | Technology         |
|----------|--------------------|
| Frontend | React + TypeScript |
| Backend  | Node.js + TypeScript |
| Database | PostgreSQL         |

---

## Where to Spend Your Time

> **Backend logic is the priority.** The algorithm you design for parsing,
> scoring, and ranking AI search results is what matters most.
> Frontend polish is secondary — functional, not perfect.
> Estimated time: 4–6 hours.

---

## Key Implementation Notes

- Use the OpenAI Responses API; **model name must not be exposed to the frontend**
- Simulate a real user querying ChatGPT — do not scrape the live website
- **Document your algorithm**: explain how and why you score sentiment the way you do
- Visibility = string match on brand names in the AI response body
- Sentiment = attribute extraction + scoring on brand-specific passages

---

## Deliverables

- [ ] Frontend UI with simulation input and results view
- [ ] Backend server with sentiment analysis logic (documented)
- [ ] Postgres schema storing simulations and analysis output