import appointmentController from "../controllers/appointmentController";
import { Router } from "express";
import { verifyAuth } from "../middlewares/verifyAuth";

const router = Router();

router.route("/book").post(verifyAuth, appointmentController.bookAppointment);
router.route("/my").get(verifyAuth, appointmentController.getUserAppointments);
router.route("/cancel/:appointmentId").patch(verifyAuth, appointmentController.cancelAppointment);
router.route("/").get(verifyAuth, appointmentController.getAllAppointments);
router.route("/status/:appointmentId").patch(verifyAuth, appointmentController.updateAppointmentStatus);

export default router;