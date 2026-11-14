import { Router, type IRouter } from "express";
import {
  PreviewSyntheticImportBody, PreviewSyntheticImportResponse,
  CommitSyntheticImportBody, CommitSyntheticImportResponse,
  AdvanceDemoBody, AdvanceDemoResponse, ResetDemoBody, ResetDemoResponse,
} from "@workspace/api-zod";
import { changeDemo, getDemoId, readDemo } from "../lib/demo-store";
import { applyChapter, CHAPTERS, createImportedWorkspace, normalizeImport, sampleCsv } from "../lib/luma-scenario";

const router: IRouter = Router();
class DemoConflict extends Error {}

router.get("/demo/sample", (_req, res) => {
  res.set("Content-Disposition", 'attachment; filename="luma-inspired-synthetic.csv"');
  res.type("text/csv").send(sampleCsv());
});

router.post("/demo/preview", async (req, res): Promise<void> => {
  const body = PreviewSyntheticImportBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Choose provider demo or the supported synthetic CSV, maximum 48,000 characters." }); return; }
  let result;
  try { result = normalizeImport(body.data.source, body.data.csv); }
  catch (error) { res.status(400).json({ error: (error as Error).message }); return; }
  const state = await readDemo(getDemoId(req, res));
  res.json(PreviewSyntheticImportResponse.parse({ ...result, duplicate: !!state.journey }));
});

router.post("/demo/commit", async (req, res): Promise<void> => {
  const body = CommitSyntheticImportBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid synthetic import request." }); return; }
  let preview;
  try { preview = normalizeImport(body.data.source, body.data.csv); }
  catch (error) { res.status(400).json({ error: (error as Error).message }); return; }
  const result = await changeDemo(getDemoId(req, res), state => {
    if (state.journey) return { ...preview, duplicate: true, committed: false, stages: [...preview.stages, "Workspace already prepared — no duplicate import"] };
    const imported = createImportedWorkspace();
    imported.preferences = state.preferences;
    Object.assign(state, imported);
    return { ...preview, committed: true, stages: [...preview.stages, "Preparing the workspace — committed"] };
  });
  res.json(CommitSyntheticImportResponse.parse(result));
});

router.post("/demo/advance", async (req, res): Promise<void> => {
  const body = AdvanceDemoBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Provide the current chapter." }); return; }
  try {
    const state = await changeDemo(getDemoId(req, res), workspace => {
      if (!workspace.journey) throw new DemoConflict("Import the synthetic scenario first.");
      if (workspace.journey.chapter === body.data.chapter && body.data.chapter < CHAPTERS.length - 1) {
        applyChapter(workspace, body.data.chapter + 1);
      }
      return workspace;
    });
    res.json(AdvanceDemoResponse.parse(state));
  } catch (error) {
    if (!(error instanceof DemoConflict)) throw error;
    res.status(409).json({ error: error.message });
  }
});

router.post("/demo/reset", async (req, res): Promise<void> => {
  const body = ResetDemoBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Confirm reset explicitly. This clears demo edits in this browser." }); return; }
  const state = await changeDemo(getDemoId(req, res), (workspace, beforeImport) => {
    if (!workspace.journey) return workspace;
    if (!beforeImport) throw new DemoConflict("Original workspace snapshot is unavailable. Nothing was reset.");
    for (const key of Object.keys(workspace)) delete (workspace as unknown as Record<string, unknown>)[key];
    Object.assign(workspace, beforeImport);
    return workspace;
  });
  res.json(ResetDemoResponse.parse(state));
});

export default router;
