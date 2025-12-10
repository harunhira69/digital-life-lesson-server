

const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlyifmj.mongodb.net/?appName=Cluster0`;
const stripe = require("stripe")(process.env.STRIPE_SECRET);


// middleware
app.use(express.json());
app.use(cors());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});






app.get('/', (req, res) => {
  res.send('Digital life lesson are running!')
})


async function run() {
  try {
   
    await client.connect();
    const database = client.db('digital_life_lesson');
    const lessonCollection = database.collection('public_lesson');
    const usersCollection = database.collection('users');
      const paymentsCollection = database.collection('payments');


app.get('/public-lessons', async (req, res) => {
    try {
      
        const query = { visibility: "Public" };
        
       
        const result = await lessonCollection.find(query).toArray();
        
   
        res.send(result);
        
    } catch (error) {
        console.error("Error fetching public lessons:", error);

        res.status(500).send({ 
            message: "Failed to fetch public lessons from the database.", 
            error: error.message 
        });
    }
});

// GET SINGLE LESSON
app.get("/lesson/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 1. Validate ObjectId first
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid lesson ID" });
    }

    const query = { _id: new ObjectId(id) };

    // ✅ 2. Find lesson
    const lesson = await lessonCollection.findOne(query);
    if (!lesson) {
      return res.status(404).send({ message: "Lesson not found" });
    }

    // ✅ 3. Increase views
    await lessonCollection.updateOne(query, {
      $inc: { viewsCount: 1 },
    });

    // ✅ 4. Send lesson
    res.send(lesson);

  } catch (error) {
    console.error("Lesson fetch error:", error);
    res.status(500).send({
      message: "Failed to fetch lesson",
      error: error.message,
    });
  }
});



// users api 
app.post("/users", async (req, res) => {
  try {
    const user = req.body; // name, email, image

    // ✅ Check if user already exists
    const isExist = await usersCollection.findOne({ email: user.email });
    if (isExist) {
      return res.send({
        message: "User already exists",
        inserted: false,
      });
    }

    // ✅ Assign default role
    const newUser = {
      ...user,
      role: "Free",          // ✅ IMPORTANT
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.send({
      inserted: true,
      userId: result.insertedId,
    });

  } catch (error) {
    res.status(500).send({
      message: "User insert failed",
      error: error.message,
    });
  }
});

// ✅ Get user role by email
app.get("/users/role/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const user = await usersCollection.findOne({ email });

    res.send({
      role: user?.role || "Free",
    });

  } catch (error) {
    res.status(500).send({
      message: "Failed to get user role",
      error: error.message,
    });
  }
});

app.post('/checkout-session', async (req, res) => {
  try {
    const { email, cost = 1500 } = req.body;
    const amount = parseInt(cost) * 100;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: { name: `Premium Subscription for ${email}` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { email },
      customer_email: email,
      success_url: `${process.env.SITE_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/payment/cancel`,
    });

    // ✅ Send URL directly to frontend
    res.send({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    res.status(500).send({ error: error.message });
  }
});



    // Verify Successful Payment
    app.patch('/verify-success-payment', async (req, res) => {
      try {
        const { session_id } = req.query;
        if (!session_id) return res.status(400).send({ error: "session_id missing" });

        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log("Session retrieved:", session);

        if (session.payment_status === "paid") {
          const email = session.metadata.email;

          // ✅ Update user's role to Premium
          const result = await usersCollection.updateOne(
            { email },
            { $set: { role: "Premium" } }
          );

          // ✅ Store payment info
          const paymentRecord = {
            email,
            amount: session.amount_total / 100,
            currency: session.currency,
            paymentStatus: session.payment_status,
            transactionId: session.payment_intent,
            createdAt: new Date(),
          };
          const resultPayment = await paymentsCollection.insertOne(paymentRecord);

          return res.send({
            success: true,
            updatedUser: result,
            paymentInfo: resultPayment,
          });
        }

        return res.send({ success: false });
      } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).send({ error: error.message });
      }
    });

    // Get payment history
    app.get('/payment', async (req, res) => {
      try {
        const email = req.query.email;
        const query = {};
        if (email) query.email = email;

        const payments = await paymentsCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.send(payments);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });















    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
