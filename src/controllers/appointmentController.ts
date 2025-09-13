import { Appointment } from "../models/appointmentModel";
import { User } from "../models/userModel";
import { Payment, PaymentStatus } from "../models/paymentModel";
import { razorpay } from "../utils/razorpay";
import express from "express";
import mongoose from "mongoose";

class AppointmentController {
  bookAppointment = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    const { type, storeLocation, address, date, timeSlot, amount } = req.body;

    if (!firebaseUID || !type || !date || !timeSlot || !amount) {
       res.status(400).json({ message: "Missing required fields" });
       return
    }

    if (!["store", "home"].includes(type)) {
       res.status(400).json({ message: "Invalid appointment type" });
       return
    }

    if (type === "store" && !storeLocation) {
       res.status(400).json({ message: "Store location is required for store booking" });
       return
    }

    if (type === "home" && !address) {
       res.status(400).json({ message: "Address is required for home booking" });
       return
    }

    if (amount <= 0) {
       res.status(400).json({ message: "Amount must be greater than 0" });
       return
    }

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) { res.status(404).json({ message: "User not found" });
      return}

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: `appointment_${Date.now()}`,
      });

      // Create appointment with payment details
      const newAppointment = new Appointment({
        userId: user._id,
        type,
        storeLocation: type === "store" ? storeLocation : undefined,
        address: type === "home" ? address : undefined,
        date,
        timeSlot,
        amount,
        paymentStatus: "pending"
      });

      await newAppointment.save();

      // Create payment record
      const payment = new Payment({
        userId: user._id,
        orderId: newAppointment._id, // Using appointment ID as orderId for appointments
        amount,
        method: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING
      });

      await payment.save();

      // Update appointment with payment ID
      newAppointment.paymentId = payment._id;
      await newAppointment.save();

      res.status(201).json({ 
        message: "Appointment booked successfully", 
        appointment: newAppointment,
        razorpayOrder,
        paymentId: payment._id
      });
    } catch (error) {
      res.status(500).json({ message: "Error booking appointment", error });
    }
  };

  getUserAppointments = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) { res.status(404).json({ message: "User not found" });
      return}

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
       res.status(400).json({ message: "Invalid appointment status or ID" });
       return
    }

    try {
      const updated = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status },
        { new: true }
      );
      if (!updated) { res.status(404).json({ message: "Appointment not found" });
      return}
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
      if (!user) { res.status(404).json({ message: "User not found" });
      return}

      const appointment = await Appointment.findOne({ _id: appointmentId, userId: user._id });
      if (!appointment) { res.status(404).json({ message: "Appointment not found" });
      return}

      appointment.status = "cancelled";
      await appointment.save();

      res.status(200).json({ message: "Appointment cancelled", appointment });
    } catch (error) {
      res.status(500).json({ message: "Error cancelling appointment", error });
    }
  };

  verifyAppointmentPayment = async (req: express.Request, res: express.Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ message: "All fields are required." });
        return;
      }

      // Find the payment record
      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      // Check if payment is already verified
      if (payment.status === PaymentStatus.SUCCESS) {
        res.status(409).json({ message: "Payment already verified" });
        return;
      }

      // Verify Razorpay signature
      const crypto = require("crypto");
      const hmac = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = hmac === razorpay_signature;

      // Update payment record
      payment.paidAt = new Date();
      payment.transactionId = razorpay_payment_id;
      payment.status = isValid ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      await payment.save();

      // Update appointment payment status
      const appointment = await Appointment.findById(payment.orderId);
      if (appointment) {
        appointment.paymentStatus = isValid ? "completed" : "failed";
        await appointment.save();
      }

      if (isValid) {
        res.status(200).json({
          verified: true,
          message: "Payment verified successfully",
          appointment,
          payment
        });
      } else {
        res.status(400).json({
          verified: false,
          message: "Invalid signature. Payment failed.",
          appointment,
          payment
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
}

export default new AppointmentController();