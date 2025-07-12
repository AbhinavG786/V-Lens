import { Router } from "express";
import appointment from "../controllers/appointmentController";
import { verifyUser } from "../middlewares/verifyUser";
import { verifyAdmin } from "../middlewares/verifyAdmin";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

router.post("/", verifyUser, appointment.bookAppointment);
router.get("/mine", verifyUser, appointment.getUserAppointments);
router.patch("/:appointmentId/cancel", verifyUser, appointment.cancelAppointment);

router.get("/", verifyAdmin, paginationMiddleware(10, 50), appointment.getAllAppointments);
router.patch("/:appointmentId/status", verifyAdmin, appointment.updateAppointmentStatus);

export default router;