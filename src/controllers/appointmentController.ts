import { Appointment } from "../models/appointmentModel";
import { User } from "../models/userModel";
import express from "express";

class AppointmentController {
  bookAppointment = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    const { type, storeLocation, address, date, timeSlot } = req.body;

    if (!firebaseUID || !type || !date || !timeSlot) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["store", "home"].includes(type)) {
      return res.status(400).json({ message: "Invalid appointment type" });
    }

    if (type === "store" && !storeLocation) {
      return res.status(400).json({ message: "Store location is required for store booking" });
    }

    if (type === "home" && !address) {
      return res.status(400).json({ message: "Address is required for home booking" });
    }

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) return res.status(404).json({ message: "User not found" });

      const newAppointment = new Appointment({
        userId: user._id,
        type,
        storeLocation: type === "store" ? storeLocation : undefined,
        address: type === "home" ? address : undefined,
        date,
        timeSlot
      });

      await newAppointment.save();
      res.status(201).json({ message: "Appointment booked", appointment: newAppointment });
    } catch (error) {
      res.status(500).json({ message: "Error booking appointment", error });
    }
  };

  getUserAppointments = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) return res.status(404).json({ message: "User not found" });

      const appointments = await Appointment.find({ userId: user._id }).sort({ date: -1 });
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments", error });
    }
  };

  getAllAppointments = async (req: express.Request, res: express.Response) => {
    const { skip = 0, take = 10 } = req.pagination || {};
    const { status, date, type } = req.query;

    try {
      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (date) filter.date = new Date(date as string);

      const appointments = await Appointment.find(filter)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(take));

      const total = await Appointment.countDocuments(filter);

      res.status(200).json({
        data: appointments,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments", error });
    }
  };

  updateAppointmentStatus = async (req: express.Request, res: express.Response) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!appointmentId || !["approved", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status or ID" });
    }

    try {
      const updated = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Appointment not found" });
      res.status(200).json({ message: "Status updated", appointment: updated });
    } catch (error) {
      res.status(500).json({ message: "Error updating appointment", error });
    }
  };

  cancelAppointment = async (req: express.Request, res: express.Response) => {
    const { appointmentId } = req.params;
    const firebaseUID = req.user?.uid;

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) return res.status(404).json({ message: "User not found" });

      const appointment = await Appointment.findOne({ _id: appointmentId, userId: user._id });
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });

      appointment.status = "cancelled";
      await appointment.save();

      res.status(200).json({ message: "Appointment cancelled", appointment });
    } catch (error) {
      res.status(500).json({ message: "Error cancelling appointment", error });
    }
  };
}

export default new AppointmentController();