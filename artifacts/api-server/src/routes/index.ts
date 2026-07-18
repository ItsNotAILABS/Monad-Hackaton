import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import templatesRouter from "./templates";
import statsRouter from "./stats";
import { workspaceRouter } from "./workspace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(templatesRouter);
router.use(statsRouter);
router.use(workspaceRouter);

export default router;
