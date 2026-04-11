const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendEmail");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Cart model stores userId as String; Order uses Mixed (often ObjectId in BSON).
 * Always use a string for logged-in users when writing, and match both string + ObjectId when reading orders.
 */
function getUserId(req) {
  if (req.user?._id) {
    return String(req.user._id);
  }
  const guest = req.headers["x-guest-id"];
  if (guest && String(guest).trim()) return String(guest).trim();
  return "GUEST";
}

/** Match Order.userId (Mixed: string or ObjectId) to the logged-in user's _id. */
function orderUserIdClause(userIdRaw) {
  const str = String(userIdRaw).trim();
  if (!mongoose.isValidObjectId(str)) {
    return { userId: str };
  }
  const oid = new mongoose.Types.ObjectId(str);
  // $in with both BSON types reliably matches Mixed field (e.g. "69cd2c51..." in DB)
  return { userId: { $in: [str, oid] } };
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
  const order = await Order.findOne({
    _id: req.params.orderId,
    ...orderUserIdClause(userId),
  });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.contactInfo = req.body;
  await order.save();

  res.json({ success: true, order });
});

// POST /api/orders/:orderId/pay (MOCK)
exports.payOrder = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const order = await Order.findOne({
    _id: req.params.orderId,
    ...orderUserIdClause(userId),
  }).populate("items.productId");

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

function orderTime(o) {
  return new Date(o.updatedAt || o.createdAt).getTime();
}

function sumOrderUnits(o) {
  return (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
}

function adminDonationRowFromOrder(o, donorDisplay) {
  const shortId = o._id.toString().slice(-6).toUpperCase();
  const isPaid = o.orderStatus === "PAID";
  const itemSummary = (o.items || [])
    .map((i) => {
      const p = i.productId;
      const name = p?.name || "Product";
      return `${Number(i.qty) || 0}× ${name}`;
    })
    .join(", ");
  let status = "Pending";
  if (isPaid) status = "Completed";
  else if (o.orderStatus === "FAILED" || o.payment?.status === "FAILED") status = "Failed";
  return {
    id: `DON-${shortId}`,
    orderId: String(o._id),
    donor: donorDisplay,
    type: "Product",
    contribution: itemSummary || `Order ${shortId}`,
    amount: Number(o.total) || 0,
    units: sumOrderUnits(o),
    date: new Date(o.updatedAt || o.createdAt).toISOString(),
    status,
  };
}

function donorDisplayForOrder(o, userById) {
  const uid = String(o.userId ?? "");
  if (mongoose.isValidObjectId(uid)) {
    const u = userById.get(uid);
    if (u) return u.username || u.email || "Donor";
  }
  const c = o.contactInfo || {};
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (c.email) return c.email;
  return "Guest";
}

function pctTrend(current, previous) {
  if (previous > 0) {
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: `${pct >= 0 ? "+" : ""}${pct}%`, isPositive: pct >= 0 };
  }
  if (current > 0) return { value: "+100%", isPositive: true };
  return { value: "—", isPositive: true };
}

function diffTrend(current, previous) {
  const d = current - previous;
  if (d === 0 && current === 0) return { value: "—", isPositive: true };
  return { value: `${d >= 0 ? "+" : ""}${d}`, isPositive: d >= 0 };
}

function impactFromTotals(totalMoney, units) {
  return Math.min(100, Math.round(20 + totalMoney / 100 + units / 5));
}

/** Group paid orders by calendar month (UTC) for donor reports. */
function buildMonthlyBreakdown(paidOrders) {
  const map = new Map();
  for (const o of paidOrders) {
    const t = orderTime(o);
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const period = `${y}-${String(m).padStart(2, "0")}`;
    if (!map.has(period)) {
      map.set(period, { period, totalAmount: 0, units: 0, orderCount: 0 });
    }
    const row = map.get(period);
    row.totalAmount += Number(o.total) || 0;
    row.units += sumOrderUnits(o);
    row.orderCount += 1;
  }
  return Array.from(map.values())
    .sort((a, b) => b.period.localeCompare(a.period))
    .map((row) => ({
      ...row,
      label: new Date(`${row.period}-01T12:00:00.000Z`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    }));
}

// GET /api/orders/donor-summary (+ aliases /api/me/donations, /api/users/me/donations)
exports.getMyDonationData = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const orders = await Order.find(orderUserIdClause(req.user._id))
    .populate("items.productId")
    .sort({ createdAt: -1 })
    .limit(100);

  const paid = orders.filter((o) => o.orderStatus === "PAID");
  const totalContributed = paid.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const productUnits = paid.reduce((s, o) => s + sumOrderUnits(o), 0);
  const paidCount = paid.length;
  const impactScore = impactFromTotals(totalContributed, productUnits);

  const now = Date.now();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  const last7Start = now - ms7;
  const prev7Start = now - 2 * ms7;

  const paidInRange = (t0, t1) =>
    paid.filter((o) => {
      const t = orderTime(o);
      return t >= t0 && t <= t1;
    });

  const last7Paid = paidInRange(last7Start, now);
  const prev7Paid = paidInRange(prev7Start, last7Start);

  const sumMoney = (list) => list.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const sumUnits = (list) => list.reduce((s, o) => s + sumOrderUnits(o), 0);

  const moneyLast7 = sumMoney(last7Paid);
  const moneyPrev7 = sumMoney(prev7Paid);
  const unitsLast7 = sumUnits(last7Paid);
  const unitsPrev7 = sumUnits(prev7Paid);
  const countLast7 = last7Paid.length;
  const countPrev7 = prev7Paid.length;

  const impactLast7 = impactFromTotals(sumMoney(last7Paid), sumUnits(last7Paid));
  const impactPrev7 = impactFromTotals(sumMoney(prev7Paid), sumUnits(prev7Paid));
  const impactDiff = impactLast7 - impactPrev7;

  const rawDays = parseInt(req.query.days, 10);
  const chartDays = Number.isFinite(rawDays)
    ? Math.min(366, Math.max(7, rawDays))
    : 30;
  const chartStart = now - chartDays * 24 * 60 * 60 * 1000;
  const dailyMap = {};
  for (const o of paid) {
    const t = orderTime(o);
    if (t < chartStart) continue;
    const key = new Date(t).toISOString().slice(0, 10);
    dailyMap[key] = (dailyMap[key] || 0) + (Number(o.total) || 0);
  }

  const dailyTotals = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyTotals.push({ date: key, total: dailyMap[key] || 0 });
  }

  const monthlyBreakdown = buildMonthlyBreakdown(paid);

  const rows = orders.map((o) => {
    const shortId = o._id.toString().slice(-6).toUpperCase();
    const isPaid = o.orderStatus === "PAID";
    const itemSummary = o.items
      .map((i) => {
        const p = i.productId;
        const name = p?.name || "Product";
        return `${i.qty}× ${name}`;
      })
      .join(", ");

    let status = "Pending";
    if (isPaid) status = "Completed";
    else if (o.orderStatus === "FAILED" || o.payment?.status === "FAILED") status = "Failed";

    const lines = o.items.map((i) => {
      const p = i.productId;
      const qty = Number(i.qty) || 0;
      const unit = Number(i.priceAtTime) || 0;
      const desc = p?.description ? String(p.description).trim().slice(0, 200) : "";
      return {
        productName: p?.name || "Product",
        description: desc,
        qty,
        unitPrice: unit,
        lineTotal: Math.round(qty * unit * 100) / 100,
      };
    });

    return {
      id: `DON-${shortId}`,
      orderId: String(o._id),
      type: "Product",
      contribution: itemSummary || `Order ${shortId}`,
      amount: Number(o.total) || 0,
      units: sumOrderUnits(o),
      date: new Date(o.updatedAt || o.createdAt).toISOString(),
      status,
      lines,
    };
  });

  res.json({
    success: true,
    stats: {
      totalContributed,
      productUnits,
      communitiesHelped: paidCount,
      impactScore,
      trends: {
        totalDonations: pctTrend(moneyLast7, moneyPrev7),
        productsDonated: pctTrend(unitsLast7, unitsPrev7),
        communitiesHelped: diffTrend(countLast7, countPrev7),
        impactScore: {
          value: impactDiff === 0 ? "—" : `${impactDiff >= 0 ? "+" : ""}${impactDiff}`,
          isPositive: impactDiff >= 0,
        },
      },
    },
    dailyTotals,
    monthlyBreakdown,
    orders: rows,
  });
});

// GET /api/orders/admin/stats — admin: aggregates + recent donation rows (paid order checkouts)
exports.getAdminDonationStats = asyncHandler(async (req, res) => {
  const paidOrders = await Order.find({ orderStatus: "PAID" })
    .select("items total userId")
    .lean();

  let unitsPurchased = 0;
  let totalFundsRaised = 0;
  const donorKeys = new Set();
  for (const o of paidOrders) {
    totalFundsRaised += Number(o.total) || 0;
    for (const i of o.items || []) {
      unitsPurchased += Number(i.qty) || 0;
    }
    donorKeys.add(String(o.userId));
  }

  const recentOrders = await Order.find({})
    .populate("items.productId")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const oidStrings = new Set();
  for (const o of recentOrders) {
    const s = String(o.userId ?? "");
    if (mongoose.isValidObjectId(s)) oidStrings.add(s);
  }
  const objectIds = [...oidStrings].map((id) => new mongoose.Types.ObjectId(id));
  const users = objectIds.length
    ? await User.find({ _id: { $in: objectIds } }).select("username email").lean()
    : [];
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const recentDonations = recentOrders.map((o) =>
    adminDonationRowFromOrder(o, donorDisplayForOrder(o, userById))
  );

  res.json({
    success: true,
    paidOrdersCount: paidOrders.length,
    unitsPurchased,
    totalFundsRaised,
    uniqueDonorsCount: donorKeys.size,
    recentDonations,
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

  const order = await Order.findOne({
    _id: req.params.orderId,
    ...orderUserIdClause(userId),
  }).populate("items.productId");

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