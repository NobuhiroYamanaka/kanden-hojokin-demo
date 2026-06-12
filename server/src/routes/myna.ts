import { Router } from "express";
import { mynaSearchDetail, mynaSearchList } from "../lib/mynaClient.js";
import { mapDetailResponse, mapListResponse } from "../lib/mapMyna.js";
import type { ListSearchParams } from "../types.js";

export const mynaRouter = Router();

mynaRouter.post("/list", async (req, res) => {
  const body = req.body as ListSearchParams;
  if (!body?.cityCode) {
    res.status(400).json({ ok: false, hitCount: 0, errors: ["EE002"], items: [] });
    return;
  }
  try {
    const raw = await mynaSearchList({
      cityCode: body.cityCode,
      keyword: Array.isArray(body.keyword) ? body.keyword : [],
      isEApplicable: body.isEApplicable,
    });
    res.json(mapListResponse(body.cityCode, raw));
  } catch (e) {
    console.error("[myna.list] error", e);
    res.status(502).json({ ok: false, hitCount: 0, errors: ["EE_NETWORK"], items: [] });
  }
});

mynaRouter.get("/detail", async (req, res) => {
  const psid = String(req.query.psid ?? "");
  const cityCode = String(req.query.cityCode ?? "");
  if (!psid) {
    res.status(400).json(null);
    return;
  }
  try {
    const raw = await mynaSearchDetail(psid);
    const mapped = mapDetailResponse(cityCode, raw);
    res.json(mapped);
  } catch (e) {
    console.error("[myna.detail] error", e);
    res.status(502).json(null);
  }
});
