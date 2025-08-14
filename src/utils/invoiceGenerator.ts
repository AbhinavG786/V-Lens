import PDFDocument from "pdfkit";
import { OrderType } from "../models/orderModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

export const generateInvoicePDF = async (order: OrderType) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Capture PDF data into buffer
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(chunks);

        // Upload to Cloudinary in "invoices" folder
        const uploadResult = await uploadBufferToCloudinary(
          pdfBuffer,
          `${order.orderNumber}.pdf`,
          "invoices"
        );

        if (typeof uploadResult === "object" && uploadResult !== null && "secure_url" in uploadResult) {
          resolve(uploadResult.secure_url);
        } else {
          resolve("");
        }
      });

      // --- PDF CONTENT START ---
      doc.fontSize(20).text("Tax Invoice", { align: "center" }).moveDown(1);

      // Seller Info
      doc.fontSize(12).text("Seller:", { underline: true });
      doc.text("Valsco Technology Pvt. Ltd.");
      doc.text("123 Optical Street, New Delhi");
      doc.text("GSTIN: 07ABCDE1234F1Z5");
      doc.moveDown(1);

      // Buyer Info
      doc.fontSize(12).text("Buyer:", { underline: true });
      doc.text(`User ID: ${order.userId}`);
      if (order.gstDetails?.isGSTPurchase) {
        doc.text(`Company Name: ${order.gstDetails.companyName}`);
        doc.text(`GST Number: ${order.gstDetails.gstNumber}`);
        doc.text(`Registration No.: ${order.gstDetails.registrationNumber}`);
        doc.text(`Address: ${order.gstDetails.companyAddress}`);
      } else {
        const addr = order.shippingAddress;
        doc.text(`Shipping Address: ${addr?.street}, ${addr?.city}, ${addr?.state} ${addr?.zipCode}, ${addr?.country}`);
      }
      doc.moveDown(1);

      // Order Info
      doc.text(`Invoice No: ${order.orderNumber}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.moveDown(1);

      // Table Header
      doc.font("Helvetica-Bold");
      doc.text("Product", 50, doc.y, { continued: true });
      doc.text("Qty", 250, doc.y, { continued: true });
      doc.text("Price", 300, doc.y, { continued: true });
      doc.text("GST", 370, doc.y, { continued: true });
      doc.text("Total", 450, doc.y);
      doc.font("Helvetica");

      // Table Rows
      order.items.forEach((item) => {
        const total = (item.finalPrice + item.gstAmount) * item.quantity;
        doc.text(item.productId.toString(), 50, doc.y, { continued: true });
        doc.text(item.quantity.toString(), 250, doc.y, { continued: true });
        doc.text(item.finalPrice.toFixed(2), 300, doc.y, { continued: true });
        doc.text(item.gstAmount.toFixed(2), 370, doc.y, { continued: true });
        doc.text(total.toFixed(2), 450, doc.y);
      });

      doc.moveDown(1);

      // Summary
      doc.text(`Subtotal: ₹${order.subTotalAmount.toFixed(2)}`);
      doc.text(`Discount: ₹${order.discountAmount.toFixed(2)}`);
      if (order.gstDetails?.isGSTPurchase) {
        doc.text(
          `GST (${order.gstDetails.gstRate}%): ₹${order.gstDetails.gstAmount.toFixed(2)}`
        );
      }
      doc.font("Helvetica-Bold").text(`Total: ₹${order.totalAmount.toFixed(2)}`);

      // End PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
