import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { db, demoWorkspaces } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetWorkspaceResponse } from "@workspace/api-zod";
import { createDemoWorkspace, normalizeDemoColors, type Workspace } from "./demo-seed";

const cookieName = "afterglow_demo";

// This is a browser-scoped synthetic demo identifier, NOT user authentication.
export function getDemoId(req: Request, res: Response): string {
  const cookie = req.headers.cookie?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (cookie && /^[a-f0-9]{64}$/.test(cookie)) return cookie;
  const id = randomBytes(32).toString("hex");
  res.cookie(cookieName, id, {
    httpOnly: true, sameSite: "strict", secure: req.secure || req.get("x-forwarded-proto") === "https",
    path: "/api", maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return id;
}

async function ensure(id: string): Promise<void> {
  await db.insert(demoWorkspaces).values({ id, state: createDemoWorkspace() })
    .onConflictDoNothing();
}

export async function readDemo(id: string): Promise<Workspace> {
  await ensure(id);
  const [row] = await db.select({ state: demoWorkspaces.state }).from(demoWorkspaces)
    .where(eq(demoWorkspaces.id, id));
  return normalizeDemoColors(GetWorkspaceResponse.parse(row?.state));
}

export async function changeDemo<T>(id: string, mutate: (state: Workspace, beforeImport?: Workspace) => T): Promise<T> {
  await ensure(id);
  return db.transaction(async tx => {
    const [row] = await tx.select({ state: demoWorkspaces.state }).from(demoWorkspaces)
      .where(eq(demoWorkspaces.id, id)).for("update");
    const raw = row?.state as Record<string, unknown>;
    const state = normalizeDemoColors(GetWorkspaceResponse.parse(raw));
    const previous = structuredClone(state);
    const backup = raw?._beforeImport ? GetWorkspaceResponse.parse(raw._beforeImport) : undefined;
    const result = mutate(state, backup);
    // Preserve the original browser workspace privately in the JSON envelope, not the API.
    const saved = GetWorkspaceResponse.parse(state);
    const beforeImport = saved.journey ? (backup ?? (!previous.journey ? previous : undefined)) : undefined;
    await tx.update(demoWorkspaces).set({ state: { ...saved, ...(beforeImport ? { _beforeImport: beforeImport } : {}) }, updatedAt: new Date() })
      .where(eq(demoWorkspaces.id, id));
    return result;
  });
}
