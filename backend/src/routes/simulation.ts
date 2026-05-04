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

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Find brand result ids for this simulation
    const results = await prisma.brandResult.findMany({ where: { simulationId: id }, select: { id: true } });
    const resultIds = results.map(r => r.id);

    if (resultIds.length > 0) {
      // Delete attributes first
      await prisma.brandAttribute.deleteMany({ where: { brandResultId: { in: resultIds } } });
      // Delete brand results
      await prisma.brandResult.deleteMany({ where: { simulationId: id } });
    }

    // Delete the simulation
    await prisma.simulation.delete({ where: { id } });

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
