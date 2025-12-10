# AI Coding Agent Instructions for digital-life-lesson-server

## Project Overview
Node.js/Express server for digital life lessons with user authentication (Firebase), MongoDB database, and Stripe payment integration for premium membership upgrade.

**Tech Stack:**
- Runtime: Node.js
- Framework: Express.js v5.2
- Authentication: Firebase Admin SDK
- Database: MongoDB v7.0
- Payments: Stripe v20.0
- Utilities: CORS, dotenv, nodemon

---

## Architecture & Core Components

### 1. Authentication Layer
- **Firebase Admin SDK**: Server-side verification of Firebase JWT tokens
- **Middleware** `verifyFbToken`: Validates Authorization header, extracts and decodes token
- **Pattern**: All protected routes use `verifyFbToken` middleware to get `req.decoded_email`
- **File**: See lines 35-58 in `server.js`

### 2. Database Layer
- **MongoDB Collections**:
  - `public_lesson`: Stores lesson content with `visibility: "Public"`, `viewsCount`, etc.
  - `users`: Stores user profiles with fields: `email`, `name`, `image`, `role`, `isPremium` (boolean)
- **User Schema on Creation**: Default role is "Free", `isPremium: false`
- **Single Source of Truth**: Always verify `isPremium` from MongoDB on protected requests

### 3. Payment System (Stripe)
- **Checkout Flow**: User → POST `/create-checkout-session` → Stripe Checkout → Success/Cancel
- **Premium Price**: ৳1500 (150,000 paisa) - one-time lifetime access
- **Webhook Integration**: Stripe sends `checkout.session.completed` → MongoDB updates `isPremium: true`
- **Verification**: Use `/user/premium-status` endpoint to sync premium status from MongoDB
- **Key Files**: 
  - Endpoints: Lines 215-290 in `server.js`
  - Guide: `STRIPE_PAYMENT_GUIDE.md` (comprehensive setup & testing)
  - Pages: `public/payment-success.html`, `public/payment-cancel.html`

---

## Critical Configuration

### Environment Variables (`.env`)
```env
# Database
DB_USER=your_mongo_username
DB_PASS=your_mongo_password

# Firebase Admin
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_AUTH_URI=...
FIREBASE_TOKEN_URI=...
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=...
FIREBASE_CLIENT_X509_CERT_URL=...
FIREBASE_UNIVERSE_DOMAIN=...

# Stripe (test keys for development)
STRIPE_SECRET=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Server
PORT=3000
FRONTEND_URL=http://localhost:3000
```

**Critical Note**: `FIREBASE_PRIVATE_KEY` needs newline characters properly escaped. Use `.replace(/\\n/g, '\n')` when loading.

---

## API Endpoints Summary

### Lessons
- `GET /public-lessons` - List all public lessons
- `GET /lesson/:id` - Get single lesson (increments viewsCount)

### Users
- `POST /users` - Create new user (default role: "Free")
- `GET /users/role/:email` - Get user role and premium status

### Premium & Payment
- `POST /create-checkout-session` - Create Stripe checkout (requires Firebase token)
- `GET /user/premium-status` - Get user's current premium status from MongoDB (requires Firebase token)
- `GET /payment/status/:sessionId` - Verify Stripe payment completion
- `POST /webhook/stripe` - Stripe webhook handler (raw body, signature verified)

---

## Development Workflow

### Startup
```bash
npm install                    # Install dependencies (Stripe already added)
node server.js                 # Start server on port 3000
npm run dev                    # With nodemon (auto-restart on file changes)
```

### Testing Stripe Payments
1. Get test keys from `https://dashboard.stripe.com/apikeys`
2. Set `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` in `.env`
3. Use test card `4242 4242 4242 4242` for successful payments
4. Use Stripe CLI locally: `stripe listen --forward-to localhost:3000/webhook/stripe`
5. See `STRIPE_PAYMENT_GUIDE.md` for full testing details

---

## Key Conventions & Patterns

### Premium Verification Pattern
**Always use MongoDB as single source of truth.** Don't rely on Firebase claims:
```javascript
// ✅ CORRECT
const user = await usersCollection.findOne({ email });
if (user.isPremium) { /* grant access */ }

// ❌ WRONG - Firebase token doesn't contain payment info
if (req.decoded_claims.premium) { /* incorrect! */ }
```

### Middleware Composition
Protected routes stack middleware in order:
```javascript
app.get("/endpoint", verifyFbToken, verifyPremiumStatus, handler);
// 1. verifyFbToken → extracts req.decoded_email
// 2. verifyPremiumStatus → fetches user from MongoDB, sets req.isPremium and req.user
// 3. handler → can use req.decoded_email, req.isPremium, req.user
```

### Webhook Safety
Raw body middleware MUST come before `express.json()`:
```javascript
// Correct order in server.js (lines ~67-70)
app.use('/webhook/stripe', express.raw({type: 'application/json'}));
app.use(express.json());
app.use(cors());
```

---

## Common Tasks

| Task | Command | Notes |
|------|---------|-------|
| Start with auto-reload | `npm run dev` | Requires dev script in package.json |
| Test an endpoint | `curl -H "Authorization: Bearer TOKEN" http://localhost:3000/user/premium-status` | Get token from Firebase |
| View MongoDB documents | Connect with MongoDB Compass | Use connection string from .env |
| Test Stripe webhook | Use Stripe CLI or Postman | See `STRIPE_PAYMENT_GUIDE.md` |

---

## Important Files Reference

- `server.js` (283 lines)
  - Lines 1-34: Imports, config, Firebase init
  - Lines 35-58: `verifyFbToken` middleware
  - Lines 59-75: Express setup, raw body for webhooks, static files
  - Lines 100-120: Public lessons endpoint
  - Lines 195-210: User creation with default "Free" role
  - Lines 215-290: All Stripe payment endpoints and webhook handler

- `STRIPE_PAYMENT_GUIDE.md` - Complete setup guide with testing, error handling
- `public/payment-success.html` - Post-payment success page
- `public/payment-cancel.html` - Payment cancellation page
- `.env` - Environment variables (not in repo, must create locally)

---

## Next Development Steps

1. **Frontend Integration**:
   - Add "Upgrade to Premium" button that calls `/create-checkout-session`
   - Add Stripe test key to frontend for checkout redirect
   - Implement `/user/premium-status` check on app load

2. **Protected Routes**:
   - Add `verifyPremiumStatus` middleware to premium lesson endpoints
   - Return 403 Forbidden if `req.isPremium === false`

3. **Webhook Testing**:
   - Set webhook URL in Stripe dashboard
   - Test with Stripe test cards
   - Verify MongoDB updates after payment

4. **Production Deployment**:
   - Switch Stripe keys from `sk_test_` to `sk_live_`
   - Update webhook URL to production domain
   - Ensure `.env` has all required variables on production server

---

## Debugging Resources
- Check logs in terminal for "Firebase Admin initialized" and webhook processing messages
- See `STRIPE_PAYMENT_GUIDE.md` for comprehensive debugging checklist
- MongoDB query: `db.users.findOne({email: "..."})` to verify isPremium field
