import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/status", (_req, res) => {
  res.json({
    status: "ok",
    message: "Express server is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
