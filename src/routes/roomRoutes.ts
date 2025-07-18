import room from "../controllers/roomController"
import firebaseAuth from "../middlewares/firebaseAuth"
import { Router } from "express"
import upload from "../middlewares/upload"

const router=Router()

router.route("/create").post(firebaseAuth.verifySessionCookie,room.getOrCreateRoom)
router.route("/message").post(upload.array('files'),room.createMessage)
router.route("/end-chat/:roomId").post(firebaseAuth.verifySessionCookie, room.endChat)
router.route("/feedback").post(firebaseAuth.verifySessionCookie, room.submitFeedback)
router.route("/:roomId/messages").get(firebaseAuth.verifySessionCookie, room.getRoomMessages)


export default router