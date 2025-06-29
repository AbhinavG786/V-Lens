import room from "../controllers/roomController"
import { Router } from "express"

const router=Router()

router.route("/create").post(room.getOrCreateRoom)

export default router