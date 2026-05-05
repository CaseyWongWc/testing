import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wsStatusRouter from "./ws-status";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wsStatusRouter);

export default router;
