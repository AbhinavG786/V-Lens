import { Router } from "express";
import appointment from "../controllers/appointmentController";
import adminAuth from "../middlewares/adminAuth"
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

router.post("/", FirebaseAuthMiddleware.verifySessionCookie, appointment.bookAppointment);
router.get("/mine", FirebaseAuthMiddleware.verifySessionCookie, appointment.getUserAppointments);
router.patch("/:appointmentId/cancel", FirebaseAuthMiddleware.verifySessionCookie, appointment.cancelAppointment);
router.get("/", adminAuth.verifyAdminSession, paginationMiddleware(10, 50), appointment.getAllAppointments);
router.patch("/:appointmentId/status", adminAuth.verifyAdminSession, appointment.updateAppointmentStatus);

export default router;