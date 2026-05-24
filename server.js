const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(
    process.env.DB_PASS
  )}@cluster0.tlyifmj.mongodb.net/digital_life_lesson?retryWrites=true&w=majority`;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: [
      process.env.SITE_DOMAIN || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
  })
);

// ─── MongoDB Client ───────────────────────────────────────────────────────────
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Digital Life Lessons server is running!');
});

// ─── Main async function ──────────────────────────────────────────────────────
async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB!');

    const db = client.db('digital_life_lesson');
    const lessonCollection    = db.collection('public_lesson');
    const usersCollection     = db.collection('users');
    const paymentsCollection  = db.collection('payments');
    const favoritesCollection = db.collection('favorites');
    const commentsCollection  = db.collection('comments');
    const reportsCollection   = db.collection('lessonReports');

    // ═══════════════════════════════════════════════════════════════════════════
    // MIDDLEWARE: Verify Admin
    // ═══════════════════════════════════════════════════════════════════════════
    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.query.email || req.body.email;
        if (!email) return res.status(401).send({ message: 'Email required' });

        const user = await usersCollection.findOne({ email });
        if (!user || user.role !== 'admin') {
          return res.status(403).send({ message: 'Access denied. Admins only.' });
        }
        req.adminUser = user;
        next();
      } catch (error) {
        res.status(500).send({ message: 'Admin verification failed', error: error.message });
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC LESSONS APIs
    // ═══════════════════════════════════════════════════════════════════════════

    // GET all public lessons (search + filter + sort + pagination)
    app.get('/public-lessons', async (req, res) => {
      try {
        const {
          category, emotionalTone, search,
          sort, page = 1, limit = 9,
          accessLevel,
        } = req.query;

        const query = { visibility: 'Public' };
        if (category)      query.category      = category;
        if (emotionalTone) query.emotionalTone  = emotionalTone;
        if (accessLevel)   query.accessLevel    = accessLevel;
        if (search) {
          query.$or = [
            { title:       { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { category:    { $regex: search, $options: 'i' } },
          ];
        }

        let sortOption = { createdDate: -1 };
        if (sort === 'oldest')    sortOption = { createdDate:  1 };
        if (sort === 'mostSaved') sortOption = { savesCount:  -1 };
        if (sort === 'mostLiked') sortOption = { likesCount:  -1 };
        if (sort === 'mostViewed')sortOption = { viewsCount:  -1 };

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await lessonCollection.countDocuments(query);
        const lessons = await lessonCollection
          .find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        res.send({
          lessons,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
        });
      } catch (error) {
        console.error('Error fetching public lessons:', error);
        res.status(500).send({ message: 'Failed to fetch public lessons', error: error.message });
      }
    });

    // GET featured lessons (admin-controlled, for home page)
    app.get('/featured-lessons', async (req, res) => {
      try {
        const lessons = await lessonCollection
          .find({ visibility: 'Public', featured: true })
          .sort({ createdDate: -1 })
          .limit(6)
          .toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch featured lessons', error: error.message });
      }
    });

    // GET top contributors (users with most public lessons) — for home page
    app.get('/top-contributors', async (req, res) => {
      try {
        const contributors = await lessonCollection
          .aggregate([
            { $match: { visibility: 'Public' } },
            {
              $group: {
                _id:         '$creatorEmail',
                name:        { $first: '$creatorName' },
                photo:       { $first: '$creatorPhotoUrl' },
                lessonCount: { $sum: 1 },
              },
            },
            { $sort: { lessonCount: -1 } },
            { $limit: 6 },
          ])
          .toArray();
        res.send(contributors);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch top contributors', error: error.message });
      }
    });

    // GET most saved lessons — for home page
    app.get('/most-saved-lessons', async (req, res) => {
      try {
        const lessons = await lessonCollection
          .find({ visibility: 'Public' })
          .sort({ savesCount: -1 })
          .limit(6)
          .toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch most saved lessons', error: error.message });
      }
    });

    // GET distinct categories (for filter dropdowns)
    app.get('/categories', async (req, res) => {
      try {
        const categories = await lessonCollection.distinct('category', { visibility: 'Public' });
        res.send(categories.filter(Boolean));
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch categories', error: error.message });
      }
    });

    // GET distinct emotional tones (for filter dropdowns)
    app.get('/emotional-tones', async (req, res) => {
      try {
        const tones = await lessonCollection.distinct('emotionalTone', { visibility: 'Public' });
        res.send(tones.filter(Boolean));
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch emotional tones', error: error.message });
      }
    });

    // GET single lesson by ID
    app.get('/lesson/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        const query  = { _id: new ObjectId(id) };
        const lesson = await lessonCollection.findOne(query);
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        // Increment view count
        await lessonCollection.updateOne(query, { $inc: { viewsCount: 1 } });

        res.send(lesson);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch lesson', error: error.message });
      }
    });

    // GET related lessons (by category OR emotionalTone) — for lesson details page
    app.get('/related-lessons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid ID' });

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(id) });
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const baseFilter = { _id: { $ne: new ObjectId(id) }, visibility: 'Public' };

        const [byCategory, byTone] = await Promise.all([
          lessonCollection
            .find({ ...baseFilter, category: lesson.category })
            .limit(6)
            .toArray(),
          lessonCollection
            .find({ ...baseFilter, emotionalTone: lesson.emotionalTone })
            .limit(6)
            .toArray(),
        ]);

        res.send({ byCategory, byTone });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch related lessons', error: error.message });
      }
    });

    // GET all public lessons by a specific creator (for profile page / "View all by author")
    app.get('/creator-lessons/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const lessons = await lessonCollection
          .find({ creatorEmail: email, visibility: 'Public' })
          .sort({ createdDate: -1 })
          .toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch creator lessons', error: error.message });
      }
    });

    // GET author stats (total lessons created) — shown in lesson details author card
    app.get('/author-stats/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const totalLessons = await lessonCollection.countDocuments({ creatorEmail: email, visibility: 'Public' });
        const author = await usersCollection.findOne({ email }, { projection: { name: 1, image: 1, email: 1 } });
        res.send({ totalLessons, author });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch author stats', error: error.message });
      }
    });

    // POST create lesson
    app.post('/lessons', async (req, res) => {
      try {
        const {
          title, description, category,
          emotionalTone, imageUrl, privacy,
          accessLevel, email,
        } = req.body;

        if (!title || !description || !category || !emotionalTone || !email) {
          return res.status(400).send({ message: 'Missing required fields' });
        }

        const creator = await usersCollection.findOne({ email });
        if (!creator) return res.status(404).send({ message: 'User not found' });

        // Only Premium users or admin can create Premium-access lessons
        const isPremiumUser = creator.role === 'Premium' || creator.role === 'admin';
        if (accessLevel === 'Premium' && !isPremiumUser) {
          return res.status(403).send({ message: 'Upgrade to Premium to create premium lessons' });
        }

        const newLesson = {
          title:           title.trim(),
          description:     description.trim(),
          category,
          emotionalTone,
          imageUrl:        imageUrl || '',
          privacy,
          accessLevel:     accessLevel || 'Free',
          creatorEmail:    email,
          creatorName:     creator.name || 'Anonymous',
          creatorPhotoUrl: creator.image || '',
          visibility:      privacy === 'Public' ? 'Public' : 'Private',
          viewsCount:      0,
          likesCount:      0,
          savesCount:      0,
          likes:           [],
          featured:        false,
          flagged:         false,
          reportCount:     0,
          createdDate:     new Date(),
          updatedDate:     new Date(),
        };

        const result = await lessonCollection.insertOne(newLesson);
        res.send({ insertedId: result.insertedId, lesson: newLesson });
      } catch (error) {
        res.status(500).send({ message: 'Failed to add lesson', error: error.message });
      }
    });

    // GET my lessons by email (user dashboard)
    app.get('/my-lessons/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const lessons = await lessonCollection
          .find({ creatorEmail: email })
          .sort({ createdDate: -1 })
          .toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch user lessons', error: error.message });
      }
    });

    // PATCH update lesson (owner)
    app.patch('/lessons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid ID' });

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(id) });
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const updates = { ...req.body };

        // Prevent setting premium access without premium role
        if (
          updates.accessLevel === 'Premium' &&
          updates.userRole !== 'Premium' &&
          updates.userRole !== 'admin'
        ) {
          return res.status(403).send({ message: 'Upgrade to Premium to set Premium access' });
        }

        // Strip protected fields
        delete updates.creatorName;
        delete updates.creatorEmail;
        delete updates.userRole;
        delete updates._id;

        updates.updatedDate = new Date();

        // Sync visibility with privacy
        if (updates.privacy) {
          updates.visibility = updates.privacy === 'Public' ? 'Public' : 'Private';
        }

        await lessonCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
        res.send({ message: 'Lesson updated successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update lesson', error: error.message });
      }
    });

    // PATCH change visibility only (quick toggle from my-lessons table)
    app.patch('/lessons/:id/visibility', async (req, res) => {
      try {
        const { id } = req.params;
        const { visibility } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid ID' });
        if (!['Public', 'Private'].includes(visibility)) {
          return res.status(400).send({ message: 'Invalid visibility value' });
        }

        await lessonCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { visibility, privacy: visibility, updatedDate: new Date() } }
        );
        res.send({ message: 'Visibility updated' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update visibility', error: error.message });
      }
    });

    // PATCH change access level only (quick toggle from my-lessons table)
    app.patch('/lessons/:id/access-level', async (req, res) => {
      try {
        const { id } = req.params;
        const { accessLevel, userRole } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid ID' });

        if (accessLevel === 'Premium' && userRole !== 'Premium' && userRole !== 'admin') {
          return res.status(403).send({ message: 'Upgrade to Premium to set Premium access' });
        }

        await lessonCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { accessLevel, updatedDate: new Date() } }
        );
        res.send({ message: 'Access level updated' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update access level', error: error.message });
      }
    });

    // DELETE lesson (owner)
    app.delete('/lessons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid ID' });

        await lessonCollection.deleteOne({ _id: new ObjectId(id) });
        // Cascade delete related data
        await favoritesCollection.deleteMany({ lessonId: id });
        await commentsCollection.deleteMany({ lessonId: id });
        await reportsCollection.deleteMany({ lessonId: id });

        res.send({ message: 'Lesson deleted successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to delete lesson', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // LIKES API
    // ═══════════════════════════════════════════════════════════════════════════

    // PATCH toggle like on a lesson
    app.patch('/lessons/:id/like', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });
        if (!userId) return res.status(400).send({ message: 'userId required' });

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(id) });
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const likes        = lesson.likes || [];
        const alreadyLiked = likes.includes(userId);

        if (alreadyLiked) {
          await lessonCollection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { likes: userId }, $inc: { likesCount: -1 } }
          );
          res.send({ liked: false, message: 'Like removed' });
        } else {
          await lessonCollection.updateOne(
            { _id: new ObjectId(id) },
            { $addToSet: { likes: userId }, $inc: { likesCount: 1 } }
          );
          res.send({ liked: true, message: 'Lesson liked' });
        }
      } catch (error) {
        res.status(500).send({ message: 'Failed to toggle like', error: error.message });
      }
    });

    // GET like status for a user on a lesson
    app.get('/lessons/:id/like-status', async (req, res) => {
      try {
        const { id }     = req.params;
        const { userId } = req.query;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        const lesson = await lessonCollection.findOne(
          { _id: new ObjectId(id) },
          { projection: { likes: 1, likesCount: 1 } }
        );
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const liked = userId ? (lesson.likes || []).includes(userId) : false;
        res.send({ liked, likesCount: lesson.likesCount || 0 });
      } catch (error) {
        res.status(500).send({ message: 'Failed to get like status', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COMMENTS API
    // ═══════════════════════════════════════════════════════════════════════════

    // GET comments for a lesson
    app.get('/comments/:lessonId', async (req, res) => {
      try {
        const { lessonId } = req.params;
        const comments = await commentsCollection
          .find({ lessonId })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(comments);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch comments', error: error.message });
      }
    });

    // POST add comment
    app.post('/comments', async (req, res) => {
      try {
        const { lessonId, userEmail, userName, userPhoto, text } = req.body;
        if (!lessonId || !userEmail || !text) {
          return res.status(400).send({ message: 'lessonId, userEmail, and text are required' });
        }

        const comment = {
          lessonId,
          userEmail,
          userName:  userName  || 'Anonymous',
          userPhoto: userPhoto || '',
          text:      text.trim(),
          createdAt: new Date(),
        };

        const result = await commentsCollection.insertOne(comment);
        res.send({ insertedId: result.insertedId, comment });
      } catch (error) {
        res.status(500).send({ message: 'Failed to add comment', error: error.message });
      }
    });

    // DELETE comment (owner or admin)
    app.delete('/comments/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid comment ID' });

        await commentsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ message: 'Comment deleted' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to delete comment', error: error.message });
      }
    });

    // GET comment count for a lesson
    app.get('/comments/:lessonId/count', async (req, res) => {
      try {
        const { lessonId } = req.params;
        const count = await commentsCollection.countDocuments({ lessonId });
        res.send({ count });
      } catch (error) {
        res.status(500).send({ message: 'Failed to count comments', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // REPORT API
    // ═══════════════════════════════════════════════════════════════════════════

    // POST report a lesson
    app.post('/report-lesson', async (req, res) => {
      try {
        const { lessonId, reporterEmail, reason } = req.body;
        if (!lessonId || !reporterEmail || !reason) {
          return res.status(400).send({ message: 'lessonId, reporterEmail, and reason are required' });
        }

        // Prevent duplicate report from same user for same lesson
        const alreadyReported = await reportsCollection.findOne({ lessonId, reporterEmail });
        if (alreadyReported) {
          return res.send({ message: 'You have already reported this lesson', alreadyReported: true });
        }

        const report = {
          lessonId,
          reporterEmail,
          reason,
          createdAt: new Date(),
        };

        await reportsCollection.insertOne(report);

        // Mark lesson as flagged and increment report count
        if (ObjectId.isValid(lessonId)) {
          await lessonCollection.updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: { flagged: true }, $inc: { reportCount: 1 } }
          );
        }

        res.send({ message: 'Lesson reported successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to report lesson', error: error.message });
      }
    });

    // GET check if user already reported a lesson
    app.get('/report-lesson/check', async (req, res) => {
      try {
        const { lessonId, reporterEmail } = req.query;
        if (!lessonId || !reporterEmail) {
          return res.status(400).send({ message: 'lessonId and reporterEmail are required' });
        }
        const existing = await reportsCollection.findOne({ lessonId, reporterEmail });
        res.send({ alreadyReported: !!existing });
      } catch (error) {
        res.status(500).send({ message: 'Failed to check report status', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // USERS API
    // ═══════════════════════════════════════════════════════════════════════════

    // POST create user (called on register / first Google login)
    app.post('/users', async (req, res) => {
      try {
        const user     = req.body;
        const isExist  = await usersCollection.findOne({ email: user.email });
        if (isExist) {
          return res.send({ message: 'User already exists', inserted: false });
        }

        const newUser = {
          ...user,
          role:        'Free',
          isPremium:   false,
          createdAt:   new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        res.send({ inserted: true, userId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: 'User insert failed', error: error.message });
      }
    });

    // GET user role by email (used on app load to sync premium status)
    app.get('/users/role/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const user = await usersCollection.findOne({ email });
        res.send({ role: user?.role || 'Free', isPremium: user?.isPremium || false });
      } catch (error) {
        res.status(500).send({ message: 'Failed to get user role', error: error.message });
      }
    });

    // GET user profile by email
    app.get('/users/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
      } catch (error) {
        res.status(500).send({ message: 'Failed to get user', error: error.message });
      }
    });

    // PATCH update user profile (name, photo only — no email)
    app.patch('/users/:email', async (req, res) => {
      try {
        const { email }       = req.params;
        const { name, image } = req.body;

        const updates = {};
        if (name)  updates.name  = name;
        if (image) updates.image = image;

        if (Object.keys(updates).length === 0) {
          return res.status(400).send({ message: 'Nothing to update' });
        }

        await usersCollection.updateOne({ email }, { $set: updates });
        res.send({ message: 'Profile updated successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update profile', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STRIPE PAYMENT API
    // ═══════════════════════════════════════════════════════════════════════════

    // POST create Stripe checkout session
    app.post('/checkout-session', async (req, res) => {
      try {
        const { email, cost = 1500 } = req.body;
        if (!email) return res.status(400).send({ error: 'email required' });

        const amount = parseInt(cost) * 100; // convert to paisa

        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency:     'bdt',
                product_data: { name: 'Digital Life Lessons — Premium (Lifetime)' },
                unit_amount:  amount,
              },
              quantity: 1,
            },
          ],
          mode:           'payment',
          metadata:       { email },
          customer_email: email,
          success_url:    `${process.env.SITE_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url:     `${process.env.SITE_DOMAIN}/payment/cancel`,
        });

        res.send({ url: session.url });
      } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).send({ error: error.message });
      }
    });

    // PATCH verify successful payment & upgrade user to Premium
    app.patch('/verify-success-payment', async (req, res) => {
      try {
        const sessionId = req.query.session_id;
        if (!sessionId) return res.status(400).send({ error: 'session_id missing' });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
          const transactionId  = session.payment_intent;
          const customerEmail  = session.customer_email || session.metadata?.email;

          // Prevent duplicate recording
          const existingPayment = await paymentsCollection.findOne({ transactionId });
          if (existingPayment) {
            return res.send({
              success:       true,
              message:       'Payment already recorded',
              transactionId: existingPayment.transactionId,
            });
          }

          // Save payment record
          const payment = {
            email:         customerEmail,
            amount:        session.amount_total / 100,
            currency:      session.currency,
            paymentStatus: session.payment_status,
            transactionId,
            sessionId,
            createdAt:     new Date(),
          };
          await paymentsCollection.insertOne(payment);

          // Upgrade user role to Premium
          await usersCollection.updateOne(
            { email: customerEmail },
            {
              $set: {
                role:         'Premium',
                isPremium:    true,
                premiumSince: new Date(),
              },
            }
          );

          return res.send({ success: true, transactionId });
        }

        return res.send({ success: false, message: 'Payment not completed' });
      } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).send({ error: error.message });
      }
    });

    // GET payment history (by email, or all for admin)
    app.get('/payment', async (req, res) => {
      try {
        const { email } = req.query;
        const query     = email ? { email } : {};
        const payments  = await paymentsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(payments);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FAVORITES API
    // ═══════════════════════════════════════════════════════════════════════════

    // GET user favorites (with optional category/tone filter)
    app.get('/favorites', async (req, res) => {
      try {
        const { email, category, emotionalTone } = req.query;
        if (!email) return res.status(400).send({ message: 'Email required' });

        const query = { userEmail: email };
        if (category)      query.category     = category;
        if (emotionalTone) query.emotionalTone = emotionalTone;

        const favorites = await favoritesCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(favorites);
      } catch (error) {
        res.status(500).send({ message: 'Failed to get favorites', error: error.message });
      }
    });

    // GET check if a lesson is already in user's favorites
    app.get('/favorites/check', async (req, res) => {
      try {
        const { lessonId, userEmail } = req.query;
        if (!lessonId || !userEmail) {
          return res.status(400).send({ message: 'lessonId and userEmail are required' });
        }
        const existing = await favoritesCollection.findOne({ lessonId, userEmail });
        res.send({ isFavorite: !!existing, favoriteId: existing?._id || null });
      } catch (error) {
        res.status(500).send({ message: 'Failed to check favorite status', error: error.message });
      }
    });

    // POST add to favorites
    app.post('/favorites', async (req, res) => {
      try {
        const { lessonId, userEmail } = req.body;
        if (!lessonId || !userEmail) {
          return res.status(400).send({ message: 'lessonId & userEmail required' });
        }
        if (!ObjectId.isValid(lessonId)) return res.status(400).send({ message: 'Invalid lessonId' });

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(lessonId) });
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const alreadySaved = await favoritesCollection.findOne({ lessonId, userEmail });
        if (alreadySaved) return res.send({ message: 'Already in favorites', isFavorite: true });

        const favoriteDoc = {
          lessonId,
          userEmail,
          title:        lesson.title,
          category:     lesson.category,
          emotionalTone:lesson.emotionalTone,
          accessLevel:  lesson.accessLevel,
          imageUrl:     lesson.imageUrl || '',
          creatorName:  lesson.creatorName || '',
          createdAt:    new Date(),
        };

        const result = await favoritesCollection.insertOne(favoriteDoc);

        // Increment saves count on the lesson
        await lessonCollection.updateOne(
          { _id: new ObjectId(lessonId) },
          { $inc: { savesCount: 1 } }
        );

        res.send({ message: 'Added to favorites', favoriteId: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: 'Failed to add favorite', error: error.message });
      }
    });

    // DELETE remove from favorites (by favorite document _id)
    app.delete('/favorites/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid favorite id' });

        const fav = await favoritesCollection.findOne({ _id: new ObjectId(id) });
        if (fav && ObjectId.isValid(fav.lessonId)) {
          await lessonCollection.updateOne(
            { _id: new ObjectId(fav.lessonId) },
            { $inc: { savesCount: -1 } }
          );
        }

        await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ message: 'Removed from favorites' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to remove favorite', error: error.message });
      }
    });

    // DELETE remove from favorites by lessonId + userEmail (alternative)
    app.delete('/favorites', async (req, res) => {
      try {
        const { lessonId, userEmail } = req.query;
        if (!lessonId || !userEmail) {
          return res.status(400).send({ message: 'lessonId and userEmail required' });
        }

        const fav = await favoritesCollection.findOne({ lessonId, userEmail });
        if (!fav) return res.status(404).send({ message: 'Favorite not found' });

        if (ObjectId.isValid(lessonId)) {
          await lessonCollection.updateOne(
            { _id: new ObjectId(lessonId) },
            { $inc: { savesCount: -1 } }
          );
        }

        await favoritesCollection.deleteOne({ _id: fav._id });
        res.send({ message: 'Removed from favorites' });
      } catch (error) {
        res.status(500).send({ message: 'Failed to remove favorite', error: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // USER DASHBOARD API
    // ═══════════════════════════════════════════════════════════════════════════

    // GET dashboard stats (overview cards + recent lessons)
    app.get('/dashboard-stats', async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ message: 'Email required' });

        const [
          totalLessons,
          publicLessons,
          privateLessons,
          favorites,
          recentLessons,
          totalLikes,
          totalSaves,
        ] = await Promise.all([
          lessonCollection.countDocuments({ creatorEmail: email }),
          lessonCollection.countDocuments({ creatorEmail: email, visibility: 'Public' }),
          lessonCollection.countDocuments({ creatorEmail: email, visibility: 'Private' }),
          favoritesCollection.countDocuments({ userEmail: email }),
          lessonCollection
            .find({ creatorEmail: email })
            .sort({ createdDate: -1 })
            .limit(5)
            .toArray(),
          // Sum total likes across all user's lessons
          lessonCollection
            .aggregate([
              { $match: { creatorEmail: email } },
              { $group: { _id: null, total: { $sum: '$likesCount' } } },
            ])
            .toArray(),
          // Sum total saves across all user's lessons
          lessonCollection
            .aggregate([
              { $match: { creatorEmail: email } },
              { $group: { _id: null, total: { $sum: '$savesCount' } } },
            ])
            .toArray(),
        ]);

        res.send({
          totalLessons,
          publicLessons,
          privateLessons,
          favorites,
          recentLessons,
          totalLikes:  totalLikes[0]?.total  || 0,
          totalSaves:  totalSaves[0]?.total   || 0,
        });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // GET weekly analytics data (for dashboard chart — lessons created per day last 7 days)
    app.get('/dashboard-weekly-stats', async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ message: 'Email required' });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const pipeline = [
          {
            $match: {
              creatorEmail: email,
              createdDate:  { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdDate' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];

        const raw = await lessonCollection.aggregate(pipeline).toArray();

        // Fill in missing days with 0
        const result = [];
        for (let i = 6; i >= 0; i--) {
          const d    = new Date();
          d.setDate(d.getDate() - i);
          const key  = d.toISOString().split('T')[0];
          const day  = d.toLocaleDateString('en-US', { weekday: 'short' });
          const found = raw.find((r) => r._id === key);
          result.push({ date: key, day, count: found ? found.count : 0 });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN DASHBOARD API
    // ═══════════════════════════════════════════════════════════════════════════

    // GET admin overview stats
    app.get('/dashboard/admin/stats', verifyAdmin, async (req, res) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          totalUsers,
          premiumUsers,
          totalPublicLessons,
          totalPrivateLessons,
          totalLessons,
          flaggedLessons,
          todayLessons,
          totalComments,
          totalReports,
        ] = await Promise.all([
          usersCollection.countDocuments(),
          usersCollection.countDocuments({ role: 'Premium' }),
          lessonCollection.countDocuments({ visibility: 'Public' }),
          lessonCollection.countDocuments({ visibility: 'Private' }),
          lessonCollection.countDocuments(),
          lessonCollection.countDocuments({ flagged: true }),
          lessonCollection.countDocuments({ createdDate: { $gte: today } }),
          commentsCollection.countDocuments(),
          reportsCollection.countDocuments(),
        ]);

        // Most active contributors (top 5)
        const topContributors = await lessonCollection
          .aggregate([
            {
              $group: {
                _id:         '$creatorEmail',
                name:        { $first: '$creatorName' },
                photo:       { $first: '$creatorPhotoUrl' },
                lessonCount: { $sum: 1 },
              },
            },
            { $sort: { lessonCount: -1 } },
            { $limit: 5 },
          ])
          .toArray();

        res.send({
          totalUsers,
          premiumUsers,
          totalPublicLessons,
          totalPrivateLessons,
          totalLessons,
          flaggedLessons,
          todayLessons,
          totalComments,
          totalReports,
          topContributors,
        });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch admin stats', error: error.message });
      }
    });

    // GET admin lesson growth chart (lessons per day, last 30 days)
    app.get('/dashboard/admin/lesson-growth', verifyAdmin, async (req, res) => {
      try {
        const { days = 30 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (parseInt(days) - 1));
        daysAgo.setHours(0, 0, 0, 0);

        const raw = await lessonCollection
          .aggregate([
            { $match: { createdDate: { $gte: daysAgo } } },
            {
              $group: {
                _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdDate' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        const result = [];
        for (let i = parseInt(days) - 1; i >= 0; i--) {
          const d     = new Date();
          d.setDate(d.getDate() - i);
          const key   = d.toISOString().split('T')[0];
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const found = raw.find((r) => r._id === key);
          result.push({ date: key, label, count: found ? found.count : 0 });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch lesson growth', error: error.message });
      }
    });

    // GET admin user growth chart (users registered per day, last 30 days)
    app.get('/dashboard/admin/user-growth', verifyAdmin, async (req, res) => {
      try {
        const { days = 30 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (parseInt(days) - 1));
        daysAgo.setHours(0, 0, 0, 0);

        const raw = await usersCollection
          .aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            {
              $group: {
                _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        const result = [];
        for (let i = parseInt(days) - 1; i >= 0; i--) {
          const d     = new Date();
          d.setDate(d.getDate() - i);
          const key   = d.toISOString().split('T')[0];
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const found = raw.find((r) => r._id === key);
          result.push({ date: key, label, count: found ? found.count : 0 });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch user growth', error: error.message });
      }
    });

    // GET all users (admin — manage users page)
    app.get('/dashboard/admin/manage-users', verifyAdmin, async (req, res) => {
      try {
        const { search, role } = req.query;
        const query = {};
        if (role)   query.role  = role;
        if (search) {
          query.$or = [
            { name:  { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ];
        }

        const users = await usersCollection.find(query).sort({ createdAt: -1 }).toArray();

        // Add lesson count for each user
        const usersWithCount = await Promise.all(
          users.map(async (user) => {
            const lessonCount = await lessonCollection.countDocuments({ creatorEmail: user.email });
            return { ...user, lessonCount };
          })
        );

        res.send(usersWithCount);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // PATCH update user role (admin — promote to admin / downgrade)
    app.patch('/dashboard/admin/users/:id/role', verifyAdmin, async (req, res) => {
      try {
        const { role } = req.body;
        const { id }   = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid user ID' });
        if (!['Free', 'Premium', 'admin'].includes(role)) {
          return res.status(400).send({ message: 'Invalid role' });
        }

        await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              role,
              isPremium: role === 'Premium' || role === 'admin',
            },
          }
        );
        res.send({ message: 'User role updated successfully' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // DELETE user (admin)
    app.delete('/dashboard/admin/users/:id', verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid user ID' });

        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user) return res.status(404).send({ message: 'User not found' });

        await usersCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ message: 'User deleted successfully' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // GET all lessons (admin — manage lessons page, with filters)
    app.get('/dashboard/admin/manage-lessons', verifyAdmin, async (req, res) => {
      try {
        const { category, visibility, accessLevel, flagged, search } = req.query;
        const query = {};
        if (category)    query.category    = category;
        if (visibility)  query.visibility  = visibility;
        if (accessLevel) query.accessLevel = accessLevel;
        if (flagged !== undefined) query.flagged = flagged === 'true';
        if (search) {
          query.$or = [
            { title:       { $regex: search, $options: 'i' } },
            { creatorName: { $regex: search, $options: 'i' } },
            { creatorEmail:{ $regex: search, $options: 'i' } },
          ];
        }

        const lessons = await lessonCollection.find(query).sort({ createdDate: -1 }).toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // PATCH toggle featured status (admin — manage lessons)
    app.patch('/dashboard/admin/lessons/:id/featured', verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        const lesson = await lessonCollection.findOne({ _id: new ObjectId(id) });
        if (!lesson) return res.status(404).send({ message: 'Lesson not found' });

        const newFeatured = !lesson.featured;
        await lessonCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { featured: newFeatured } }
        );
        res.send({ message: 'Featured status updated', featured: newFeatured });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // PATCH mark lesson as reviewed (admin)
    app.patch('/dashboard/admin/lessons/:id/reviewed', verifyAdmin, async (req, res) => {
      try {
        const { id }       = req.params;
        const { reviewed } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        await lessonCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { reviewed: reviewed !== false } }
        );
        res.send({ message: 'Lesson marked as reviewed' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // DELETE lesson (admin)
    app.delete('/dashboard/admin/lessons/:id', verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        await lessonCollection.deleteOne({ _id: new ObjectId(id) });
        // Cascade delete
        await favoritesCollection.deleteMany({ lessonId: id });
        await commentsCollection.deleteMany({ lessonId: id });
        await reportsCollection.deleteMany({ lessonId: id });

        res.send({ message: 'Lesson deleted successfully' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // GET reported/flagged lessons with full report details (admin)
    app.get('/dashboard/admin/reported-lessons', verifyAdmin, async (req, res) => {
      try {
        const reportedLessons = await lessonCollection
          .find({ flagged: true })
          .sort({ reportCount: -1 })
          .toArray();

        // Attach all reports for each lesson
        const withReports = await Promise.all(
          reportedLessons.map(async (lesson) => {
            const reports = await reportsCollection
              .find({ lessonId: lesson._id.toString() })
              .sort({ createdAt: -1 })
              .toArray();
            return { ...lesson, reports };
          })
        );

        res.send(withReports);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // PATCH ignore/unflag a lesson — clears flag & all its reports (admin)
    app.patch('/dashboard/admin/lessons/:id/unflag', verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid lesson ID' });

        await lessonCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { flagged: false, reportCount: 0, reviewed: true } }
        );

        // Remove all reports for this lesson
        await reportsCollection.deleteMany({ lessonId: id });

        res.send({ message: 'Lesson unflagged successfully' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // GET admin profile
    app.get('/dashboard/admin/profile', verifyAdmin, async (req, res) => {
      try {
        const email = req.query.email;
        const admin = await usersCollection.findOne({ email });
        if (!admin) return res.status(404).send({ message: 'Admin not found' });

        // Activity summary
        const [lessonsModerated, totalActions] = await Promise.all([
          lessonCollection.countDocuments({ reviewed: true }),
          reportsCollection.countDocuments(),
        ]);

        res.send({ ...admin, lessonsModerated, totalActions });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // PATCH update admin profile (name, photo)
    app.patch('/dashboard/admin/profile', verifyAdmin, async (req, res) => {
      try {
        const { email, name, image } = req.body;
        const updates = {};
        if (name)  updates.name  = name;
        if (image) updates.image = image;

        await usersCollection.updateOne({ email }, { $set: updates });
        res.send({ message: 'Admin profile updated' });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // ─── Ping DB ───────────────────────────────────────────────────────────────
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. MongoDB connection is active.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Digital Life Lesson server running on port ${port}`);
});