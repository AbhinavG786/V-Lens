import room from "../controllers/roomController"
import firebaseAuth from "../middlewares/firebaseAuth"
import { Router } from "express"
import upload from "../middlewares/upload"

const router=Router()

router.route("/create").post(firebaseAuth.verifySessionCookie,room.getOrCreateRoom)
router.route("/message").post(upload.array('files'),room.createMessage)
router.route("/end-chat").post(firebaseAuth.verifySessionCookie, room.endChat)
router.route("/feedback").post(firebaseAuth.verifySessionCookie, room.submitFeedback)


export default router