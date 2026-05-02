import { Router } from "express";
import prisma from "../db/prisma";
import { callOpenAI } from "../services/openai";
import { checkVisibility } from "../services/visibility";
import { analyzeSentiment } from "../services/sentiment";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const rawResponse = await callOpenAI(prompt);
    const visibilityResults = await checkVisibility(rawResponse);

    const brandResults = await Promise.all(
      visibilityResults.map(async (v) => {
        if (!v.isVisible) {
          return { ...v, sentimentScore: null, sentimentLabel: null, scoringMethod: null, attributes: [] };
        }
        const sentiment = await analyzeSentiment(rawResponse, v.brandName);
        return {
          ...v,
          sentimentScore: sentiment?.sentimentScore ?? null,
          sentimentLabel: sentiment?.sentimentLabel ?? null,
          scoringMethod: sentiment?.scoringMethod ?? null,
          attributes: sentiment?.attributes ?? []
        };
      })
    );

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const simulations = await prisma.simulation.findMany({
      orderBy: { createdAt: "desc" },
      include: { brandResults: { include: { attributes: true } } }
    });
    res.json(simulations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const simulation = await prisma.simulation.findUnique({
      where: { id: req.params.id },
      include: { brandResults: { include: { attributes: true } } }
    });
    if (!simulation) return res.status(404).json({ error: "Not found" });
    res.json(simulation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
