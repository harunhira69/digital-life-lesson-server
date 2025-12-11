

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

// add lesson
app.post("/lessons", async (req, res) => {
  try {
    const { title, description, category, emotionalTone, imageUrl, privacy, accessLevel, email } = req.body;

    const creator = await usersCollection.findOne({ email });
    if (!creator) return res.status(404).send({ message: "User not found" });

    if (creator.role !== "Premium" && accessLevel === "Premium") {
      return res.status(403).send({ message: "Upgrade to Premium to create paid lessons" });
    }

    const newLesson = {
      title,
      description,
      category,
      emotionalTone,
      imageUrl: imageUrl || "",
      privacy,
      accessLevel,
      creatorEmail: email,
      creatorName: creator.name || "Anonymous",
      creatorPhotoUrl: creator.image || "",
      visibility: privacy === "Public" ? "Public" : "Private",
      viewsCount: 0,
      createdDate: new Date(),
    };

    const result = await lessonCollection.insertOne(newLesson);

    res.send({ insertedId: result.insertedId, lesson: newLesson });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to add lesson", error: error.message });
  }
});


// Get Lessons
app.get("/my-lessons/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const lessons = await lessonCollection
      .find({ creatorEmail: email })
      .sort({ createdDate: -1 })
      .toArray();
    res.send(lessons);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user lessons", error: error.message });
  }
});

// Update Lessons
app.patch("/lessons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // title, description, category, emotionalTone, imageUrl, privacy, accessLevel, userRole

    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

    const lesson = await lessonCollection.findOne({ _id: new ObjectId(id) });
    if (!lesson) return res.status(404).send({ message: "Lesson not found" });

    // Premium restriction
    if (updates.accessLevel === "Premium" && updates.userRole !== "Premium") {
      return res.status(403).send({ message: "Upgrade to Premium to set Premium access" });
    }

    // Prevent updating creator info
    delete updates.creatorName;
    delete updates.creatorEmail;

    await lessonCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    res.send({ message: "Lesson updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to update lesson", error: error.message });
  }
});

// Delete Lessons

app.delete("/lessons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

    await lessonCollection.deleteOne({ _id: new ObjectId(id) });
    res.send({ message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete lesson", error: error.message });
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
    const sessionId = req.query.session_id;

    if (!sessionId) return res.status(400).send({ error: "session_id missing" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const transactionId = session.payment_intent;

      // ✅ Check if this transaction already exists
      const existingPayment = await paymentCollection.findOne({ transactionId });
      if (existingPayment) {
        return res.send({
          success: true,
          message: "Payment already recorded",
          transactionId: existingPayment.transactionId,
        });
      }

      const payment = {
        email: session.customer_email,
        amount: session.amount_total / 100,
        currency: session.currency,
        paymentStatus: session.payment_status,
        transactionId,
        createdAt: new Date(),
      };

      const resultPayment = await paymentCollection.insertOne(payment);

      return res.send({
        success: true,
        paymentInfo: resultPayment,
        transactionId,
      });
    }

    return res.send({ success: false });
  } catch (error) {
    console.error("Verify Error:", error);
    return res.status(500).send({ error: error.message });
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
