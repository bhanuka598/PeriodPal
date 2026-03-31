const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendEmail");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper to get userId from authenticated user or use a guest/default ID
function getUserId(req) {
  if (req.user?._id) {
    return req.user._id;
  }
  // Use guest ID from header, or default to "GUEST"
  return req.headers["x-guest-id"] || "GUEST";
}

// POST /api/orders/checkout
exports.checkout = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.qty * i.priceAtTime, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const order = await Order.create({
    userId,
    items: cart.items,
    subtotal,
    shipping,
    tax,
    total,
    orderStatus: "PENDING",
    payment: { status: "UNPAID" }
  });

  res.status(201).json({ success: true, order });
});

// PATCH /api/orders/:orderId/contact
exports.updateContact = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const order = await Order.findOne({ _id: req.params.orderId, userId });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.contactInfo = req.body;
  await order.save();

  res.json({ success: true, order });
});

// POST /api/orders/:orderId/pay (MOCK)
exports.payOrder = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const order = await Order.findOne({ _id: req.params.orderId, userId }).populate(
    "items.productId"
  );

  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.orderStatus === "PAID")
    return res.status(400).json({ success: false, message: "Already paid" });

  // ✅ make sure we have contact info + email
  const email = order.contactInfo?.email || req.body.email;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Contact email is required before payment. Update contact info first.",
    });
  }

  // ✅ Reduce stock
  for (const item of order.items) {
    // if populated, item.productId is the product doc
    const productDoc = item.productId?._id ? item.productId : await Product.findById(item.productId);

    if (!productDoc) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (productDoc.stockQty < item.qty) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock for ${productDoc.name || "product"}`,
      });
    }

    productDoc.stockQty -= item.qty;
    await productDoc.save();
  }

  // ✅ Close cart
  await Cart.updateOne({ userId, status: "ACTIVE" }, { $set: { status: "CHECKED_OUT" } });

  // ✅ Update order payment
  order.orderStatus = "PAID";
  order.payment = {
    status: "PAID",
    method: "MOCK",
    transactionId: `TXN_${Date.now()}`,
  };
  await order.save();

  // ✅ Send email after payment
  const itemsHtml = order.items
    .map((i) => {
      const p = i.productId; // populated product doc
      const name = p?.name || i.name || "Item";
      return `<li>${name} — Qty: ${i.qty} — $${i.priceAtTime}</li>`;
    })
    .join("");

  const html = `
    <h2>PeriodPal Payment Successful ✅</h2>
    <p>Your order has been paid successfully.</p>
    <p><b>Order ID:</b> ${order._id}</p>
    <ul>${itemsHtml}</ul>
    <p><b>Total:</b> $${order.total}</p>
    <p><b>Status:</b> PAID</p>
    <br/>
    <p>Thank you for supporting menstrual equity 💜</p>
  `;

  try {
    await sendEmail(email, "PeriodPal Order Payment Confirmation", html);
  } catch (e) {
    // Payment success should not fail just because email failed
    console.log("Email sending failed:", e.message);
  }

  res.json({ success: true, message: "Payment successful", order });
});

// GET /api/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const orders = await Order.find({ userId }).populate("items.productId").sort({ createdAt: -1 });
  
  res.json({ success: true, orders, count: orders.length });
});

// GET /api/orders/admin/stats — admin: units purchased across paid orders
exports.getAdminDonationStats = asyncHandler(async (req, res) => {
  const paidOrders = await Order.find({ orderStatus: "PAID" }).select("items");
  let unitsPurchased = 0;
  for (const o of paidOrders) {
    unitsPurchased += o.items.reduce(
      (sum, i) => sum + (Number(i.qty) || 0),
      0
    );
  }
  res.json({
    success: true,
    paidOrdersCount: paidOrders.length,
    unitsPurchased,
  });
});

// GET /api/orders/:id  (Get order by ID)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params; // ✅ match route param

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



// DELETE /api/orders/:id  (Delete order)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const deleted = await Order.findByIdAndDelete(orderId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, message: "Order deleted", order: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


// PUT /api/orders/:orderId  (Update order)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    // Map allowed fields to YOUR schema fields
    const updates = {};

    // orderStatus in schema (PENDING/PAID/FAILED)
    if (req.body.orderStatus !== undefined) updates.orderStatus = req.body.orderStatus;

    // payment is an object in schema: payment.status, payment.method, payment.transactionId
    if (req.body.payment !== undefined) updates.payment = req.body.payment;

    // contactInfo exists in schema
    if (req.body.contactInfo !== undefined) updates.contactInfo = req.body.contactInfo;

    // If you want to allow updating items (optional)
    if (req.body.items !== undefined) updates.items = req.body.items;

    const updated = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
      runValidators: true,
    }).populate("items.productId");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, message: "Order updated", order: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


// POST /api/orders/:orderId/create-payment
exports.createStripePayment = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const order = await Order.findOne({ _id: req.params.orderId, userId }).populate(
    "items.productId"
  );

  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.orderStatus === "PAID")
    return res.status(400).json({ success: false, message: "Order already paid" });

  const line_items = order.items.map((i) => {
    const p = i.productId;
    return {
      price_data: {
        currency: "usd", // change to "usd" if Stripe doesn't support LKR in your account
        product_data: {
          name: p?.name || "Product",
        },
        unit_amount: Math.round(parseFloat(i.priceAtTime) * 100), // cents
      },
      quantity: i.qty,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items,

    // store your order id in Stripe session
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },

    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  });

  // save session id (optional)
  order.payment = {
    status: "PENDING",
    method: "STRIPE",
    transactionId: session.id,
  };
  await order.save();

  res.json({ success: true, url: session.url, sessionId: session.id });
});


// POST /api/orders/webhook/stripe
exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.log("No orderId in metadata");
        return res.json({ received: true });
      }

      const order = await Order.findById(orderId).populate("items.productId");
      if (!order) return res.json({ received: true });

      if (order.orderStatus !== "PAID") {
        // ✅ reduce stock
        for (const item of order.items) {
          const productDoc = item.productId;
          if (!productDoc) continue;

          if (productDoc.stockQty < item.qty) {
            console.log("Stock not enough for", productDoc.name);
            continue;
          }

          productDoc.stockQty -= item.qty;
          await productDoc.save();
        }

        // ✅ update order paid
        order.orderStatus = "PAID";
        order.payment = {
          status: "PAID",
          method: "STRIPE",
          transactionId: session.payment_intent || session.id,
        };
        await order.save();

        // ✅ close cart (if you want)
        await Cart.updateOne(
          { userId: order.userId, status: "ACTIVE" },
          { $set: { status: "CHECKED_OUT" } }
        );

        // ✅ email receipt (if email exists)
        const email = order.contactInfo?.email;
        if (email) {
          const itemsHtml = order.items
            .map((i) => {
              const p = i.productId;
              return `<li>${p?.name || "Item"} — Qty: ${i.qty} — $${i.priceAtTime}</li>`;
            })
            .join("");

          const html = `
            <h2>PeriodPal Payment Successful ✅</h2>
            <p><b>Order ID:</b> ${order._id}</p>
            <ul>${itemsHtml}</ul>
            <p><b>Total:</b> $${order.total}</p>
            <p>Status: <b>PAID</b></p>
            <p>Thank you 💜</p>
          `;

          try {
            await sendEmail(email, "PeriodPal Payment Confirmation", html);
          } catch (e) {
            console.log("Email failed:", e.message);
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.log("Webhook handler error:", err.message);
    res.status(500).json({ success: false, message: "Webhook error", error: err.message });
  }
};