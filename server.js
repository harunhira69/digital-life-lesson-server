
const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT||3000
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlyifmj.mongodb.net/?appName=Cluster0`;
const admin = require("firebase-admin");

// Build the service account object from environment variables
const serviceAccount = {
  type: "service_account",
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Critical: fix escaped newlines
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: process.env.FIREBASE_AUTH_URI,
  tokenUri: process.env.FIREBASE_TOKEN_URI,
  authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin initialized securely from .env");



const verifyFbToken = async(req,res,next)=>{
  const token = req.headers.authorization;
  // console.log('Firebase token',token);
  if(!token){
    return res.status(401).send({message:'unauthorized access'})
  }
  try{
    const idToken = token.split(' ')[1];
    const decode = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded token",decode);
    req.decoded_email = decode.email;

  }
  catch(err){
    return res.status(401).send({message:'unauthorized access'});

  }
  next();
}

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


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
    const usersCollection = database.collection('users')







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


// users api 
app.post("/users",  async (req, res) => {
  try {
    const user = req.body; // name, email, image

    // check if exists
    const isExist = await usersCollection.findOne({ email: user.email });
    if (isExist) {
      return res.send({ message: "User already exists", inserted: false });
    }

    // assign role
    user.role = "user";

    const result = await usersCollection.insertOne(user);
    res.send(result);

  } catch (error) {
    res.status(500).send({
      message: "User insert failed",
      error: error.message,
    });
  }
});














    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
