import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

export const stripWebhook = async (request: Request, response: Response) => {

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

    // Build Stripe event (with or without webhook secret)
    let event: Stripe.Event;
    try {
        if (endpointSecret) {
            // Verify signature when secret is configured
            const signature = request.headers["stripe-signature"] as string;
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
        } else {
            // Fallback for dev when no webhook secret is set
            const rawBody = (Buffer.isBuffer(request.body) || typeof request.body === "string")
                ? request.body.toString()
                : JSON.stringify(request.body);
            event = JSON.parse(rawBody) as Stripe.Event;
        }
    } catch (err: any) {
        console.log(`⚠️ Error parsing Stripe webhook event.`, err.message || err);
        return response.sendStatus(400);
    }

    console.log('✅ Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};
            const transactionId = (metadata as any).transactionId as string | undefined;
            const appId = ((metadata as any).appId || (metadata as any).appid) as string | undefined;

            console.log('➡️ checkout.session.completed metadata:', metadata);

            if (appId === 'MakeMySite.ai' && transactionId) {
                try {
                    const transaction = await prisma.transaction.findUnique({
                        where: { id: transactionId },
                    });

                    if (!transaction) {
                        console.error('❌ Transaction not found for ID:', transactionId);
                        break;
                    }

                    if (transaction.isPaid) {
                        console.log('ℹ️ Transaction already processed:', transactionId);
                        break;
                    }

                    await prisma.$transaction([
                        prisma.transaction.update({
                            where: { id: transactionId },
                            data: { isPaid: true },
                        }),
                        prisma.user.update({
                            where: { id: transaction.userId },
                            data: { credits: { increment: transaction.credits } },
                        }),
                    ]);

                    console.log('💰 Credits added via checkout.session.completed for transaction:', transactionId);
                } catch (err: any) {
                    console.error('❌ Error updating credits on checkout.session.completed:', err.message || err);
                }
            } else {
                console.log('ℹ️ Skipping credit update (missing/invalid metadata) for checkout.session.completed');
            }
            break;
        }
        case 'payment_intent.succeeded':
            console.log('➡️ Handling payment_intent.succeeded');
            try {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];
                if (!session) {
                    console.log('ℹ️ No checkout session found for payment_intent');
                    break;
                }

                const metadata = session.metadata || {};
                const transactionId = (metadata as any).transactionId as string | undefined;
                const appId = ((metadata as any).appId || (metadata as any).appid) as string | undefined;

                console.log('➡️ payment_intent.succeeded session metadata:', metadata);

                if (appId === 'MakeMySite.ai' && transactionId) {
                    const transaction = await prisma.transaction.findUnique({
                        where: { id: transactionId },
                    });

                    if (!transaction) {
                        console.error('❌ Transaction not found for ID:', transactionId);
                        break;
                    }

                    if (transaction.isPaid) {
                        console.log('ℹ️ Transaction already processed:', transactionId);
                        break;
                    }

                    await prisma.$transaction([
                        prisma.transaction.update({
                            where: { id: transactionId },
                            data: { isPaid: true },
                        }),
                        prisma.user.update({
                            where: { id: transaction.userId },
                            data: { credits: { increment: transaction.credits } },
                        }),
                    ]);

                    console.log('💰 Credits added via payment_intent.succeeded for transaction:', transactionId);
                } else {
                    console.log('ℹ️ Skipping credit update (missing/invalid metadata) for payment_intent.succeeded');
                }
            } catch (err: any) {
                console.error('❌ Error handling payment_intent.succeeded:', err.message || err);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
}