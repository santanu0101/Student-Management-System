import { Router } from "express";

const router = Router();

router.get("/", (req, res)=>{
    res.send("hello baby");
})

export default router