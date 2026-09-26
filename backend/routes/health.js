import { Router } from "express";

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        success: true,
        version: "0.0.1"
  });
})

export default router;