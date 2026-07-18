import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, templatesTable } from "@workspace/db";
import {
  ListTemplatesQueryParams,
  GetTemplateParams,
  ListTemplatesResponse,
  GetTemplateResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/templates", async (req, res): Promise<void> => {
  const queryParsed = ListTemplatesQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  let query = db.select().from(templatesTable).$dynamic();

  if (queryParsed.data.category) {
    query = query.where(eq(templatesTable.category, queryParsed.data.category));
  }

  const templates = await query;
  res.json(ListTemplatesResponse.parse(templates));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(GetTemplateResponse.parse(template));
});

export default router;
