import { Router, type IRouter } from "express";
import {
  GetWorkspaceResponse, GetSummaryResponse,
  UpdateEventParams, UpdateEventBody, UpdateEventResponse,
  UpdatePersonParams, UpdatePersonBody, UpdatePersonResponse,
  UpdatePreferencesBody, UpdatePreferencesResponse,
  PreviewDebriefParams, PreviewDebriefBody, PreviewDebriefResponse,
  SuggestDraftParams, SuggestDraftBody, SuggestDraftResponse,
} from "@workspace/api-zod";
import { getDemoId, readDemo, changeDemo } from "../lib/demo-store";
import { createDraft, debriefCandidates } from "../lib/demo-suggestions";
import { summaryOf, eligiblePerson } from "../lib/luma-scenario";
import importRouter from "./synthetic-import";

const router: IRouter = Router();
class NotFound extends Error {}

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "GET" && req.get("sec-fetch-site") === "cross-site") {
    res.status(403).json({ error: "Cross-site requests are not allowed." });
    return;
  }
  next();
});
router.use(importRouter);

router.get("/workspace", async (req, res): Promise<void> => {
  const state = await readDemo(getDemoId(req, res));
  res.json(GetWorkspaceResponse.parse(state));
});

router.get("/summary", async (req, res): Promise<void> => {
  const state = await readDemo(getDemoId(req, res));
  res.json(GetSummaryResponse.parse(summaryOf(state)));
});

router.patch("/events/:id", async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  const body = UpdateEventBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Provide a valid event and debrief of at most 12,000 characters." }); return;
  }
  try {
    const event = await changeDemo(getDemoId(req, res), state => {
      const event = state.events.find(e => e.id === params.data.id);
      if (!event) throw new NotFound();
      event.debrief = body.data.debrief;
      return event;
    });
    res.json(UpdateEventResponse.parse(event));
  } catch (error) {
    if (!(error instanceof NotFound)) throw error;
    res.status(404).json({ error: "Event not found." });
  }
});

router.patch("/people/:id", async (req, res): Promise<void> => {
  const params = UpdatePersonParams.safeParse(req.params);
  const body = UpdatePersonBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid person update." }); return;
  }
  const due = body.data.dueDate;
  if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(Date.parse(due)) || new Date(due).toISOString().slice(0, 10) !== due)) {
    res.status(400).json({ error: "Use a valid YYYY-MM-DD follow-up date." }); return;
  }
  try {
    const person = await changeDemo(getDemoId(req, res), state => {
      const person = state.people.find(p => p.id === params.data.id);
      if (!person) throw new NotFound();
      const metChanged = body.data.met !== undefined && body.data.met !== person.met;
      Object.assign(person, body.data);
      if (metChanged) person.draft = "";
      return person;
    });
    res.json(UpdatePersonResponse.parse(person));
  } catch (error) {
    if (!(error instanceof NotFound)) throw error;
    res.status(404).json({ error: "Person not found." });
  }
});

router.patch("/preferences", async (req, res): Promise<void> => {
  const body = UpdatePreferencesBody.safeParse(req.body);
  if (!body.success || !body.data.goal.trim()) {
    res.status(400).json({ error: "Add a goal and up to 20 interests." }); return;
  }
  const preferences = await changeDemo(getDemoId(req, res), state => {
    state.preferences = {
      goal: body.data.goal.trim(),
      interests: [...new Set(body.data.interests.map(i => i.trim()).filter(Boolean))],
    };
    return state.preferences;
  });
  res.json(UpdatePreferencesResponse.parse(preferences));
});

router.post("/events/:id/debrief", async (req, res): Promise<void> => {
  const params = PreviewDebriefParams.safeParse(req.params);
  const body = PreviewDebriefBody.safeParse(req.body);
  if (!params.success || !body.success || !body.data.text.trim()) {
    res.status(400).json({ error: "Enter a debrief to review." }); return;
  }
  const state = await readDemo(getDemoId(req, res));
  const event = state.events.find(e => e.id === params.data.id);
  if (!event) {
    res.status(404).json({ error: "Event not found." }); return;
  }
  if (state.journey && event.kind === "upcoming") {
    res.status(400).json({ error: "Review debriefs after the event has ended in the demo." }); return;
  }
  res.json(PreviewDebriefResponse.parse(debriefCandidates(state, params.data.id, body.data.text)));
});

router.post("/people/:id/draft", async (req, res): Promise<void> => {
  const params = SuggestDraftParams.safeParse(req.params);
  const body = SuggestDraftBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Choose a valid draft type." }); return;
  }
  const state = await readDemo(getDemoId(req, res));
  const person = state.people.find(p => p.id === params.data.id);
  if (!person) { res.status(404).json({ error: "Person not found." }); return; }
  if (!eligiblePerson(person)) { res.status(400).json({ error: "Templates become available after confirmed shared attendance, not registration alone." }); return; }
  res.json(SuggestDraftResponse.parse(createDraft(state, person, body.data.mode)));
});

export default router;
