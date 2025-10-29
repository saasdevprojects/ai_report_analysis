import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

export function createPaymentRouter() {
  const router = express.Router();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  });

  // Create payment intent
  router.post('/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;

      // Validate the amount is a positive number
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.error('Error creating payment intent:', err);
      return res.status(500).json({
        error: {
          message: err.message,
        },
      });
    }
  });

  return router;
}
