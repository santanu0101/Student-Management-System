import { PaymentService } from "./payment.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class PaymentController {
  static async createPayment(req, res) {
    const payment = await PaymentService.createPayment(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, payment, "Payment initiated successfully"));
  }

  static async razorpayWebhook(req, res) {
    await PaymentService.handleRazorpayWebhook(req);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  }

  static async verifyPayment(req, res) {
    const result = await PaymentService.verifyPayment(req.body);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Payment verified and student enrolled successfully"
        )
      );
  }

  static async retryPayment(req, res, next) {
    const { paymentId } = req.params;

    const { payment, razorpayOrder } = await PaymentService.retryPayment(
      paymentId
    );

    res.status(200).json({
      success: true,
      message: "Payment retry created successfully",
      data: {
        payment,
        razorpayOrder,
      },
    });
  }

  static async getPayments(req, res) {
    const payments = await PaymentService.getPayments();

    res
      .status(200)
      .json(new ApiResponse(200, payments, "Payments fetched successfully"));
  }

  static async getPaymentById(req, res) {
    const payment = await PaymentService.getPaymentById(req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, payment, "Payment fetched successfully"));
  }

  static async getPaymentsByStudent(req, res) {
    const payments = await PaymentService.getPaymentsByStudent(
      req.params.studentId
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, payments, "Student payments fetched successfully")
      );
  }

  static async updatePaymentStatus(req, res) {
    const payment = await PaymentService.updatePaymentStatus(
      req.params.id,
      req.body.status
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, payment, "Payment status updated successfully")
      );
  }

  static async deletePayment(req, res) {
    await PaymentService.deletePayment(req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Payment deleted successfully"));
  }
}
