import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, projectsTable, templatesTable } from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [projects, templates] = await Promise.all([
    db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt)),
    db.select().from(templatesTable),
  ]);

  const totalProjects = projects.length;
  const publishedProjects = projects.filter((p) => p.status === "published").length;
  const draftProjects = projects.filter((p) => p.status === "draft").length;
  const totalTemplates = templates.length;
  const recentProjects = projects.slice(0, 5);

  res.json(
    GetDashboardStatsResponse.parse({
      totalProjects,
      publishedProjects,
      draftProjects,
      totalTemplates,
      recentProjects,
    }),
  );
});

export default router;
