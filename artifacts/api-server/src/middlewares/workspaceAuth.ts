import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, workspaceMembershipsTable } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    platformUserId?: number;
    activeWorkspaceId?: number;
  }
}

export interface WorkspaceRequest extends Request {
  platformUserId?: number;
  workspaceId?: number;
  workspaceRole?: string;
}

export async function requireWorkspace(req: WorkspaceRequest, res: Response, next: NextFunction) {
  const userId = req.session.platformUserId;
  const workspaceId = req.session.activeWorkspaceId;
  if (!userId || !workspaceId) {
    res.status(401).json({ error: "Authentication and an active workspace are required" });
    return;
  }
  const [membership] = await db.select().from(workspaceMembershipsTable).where(and(
    eq(workspaceMembershipsTable.userId, userId),
    eq(workspaceMembershipsTable.workspaceId, workspaceId),
  )).limit(1);
  if (!membership) {
    res.status(403).json({ error: "Workspace access denied" });
    return;
  }
  req.platformUserId = userId;
  req.workspaceId = workspaceId;
  req.workspaceRole = membership.role;
  next();
}

export function requireWorkspaceAdmin(req: WorkspaceRequest, res: Response, next: NextFunction) {
  if (!req.workspaceRole || !["owner", "admin"].includes(req.workspaceRole)) {
    res.status(403).json({ error: "Workspace administrator access required" });
    return;
  }
  next();
}
