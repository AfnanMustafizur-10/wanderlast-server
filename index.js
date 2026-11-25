const express = require('express');
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()
const uri = process.env.MONGODB_URI;
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');



const app = express()
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationError: true,
    }
});



// Key set
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)


// jwt  r token

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload);
        next()
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" });
    }
}


const run = async () => {

    try {
        // await client.connect();

        // db Connection
        const db = client.db("wanderlast")
        const destinationCollection = db.collection("destinations")
        // different connection for Booking details
        const bookingCollection = db.collection("bookings")


        // feature  niye jaowar api

        app.get("/featured", async (req, res) => {
            const result = await destinationCollection.find().limit(4).toArray()
            res.json(result)
        })



        // Bookings Niye ashar api

        app.post('/booking', verifyToken, async (req, res) => {
            const bookingsData = req.body
            const result = await bookingCollection.insertOne(bookingsData)
            res.send(result)
        })
        // booking niye jaowar api

        app.get('/booking/:userId', async (req, res) => {
            const { userId } = req.params
            const result = await bookingCollection.find({ userId: userId }).toArray()
            res.json(result);
        })

        // Booking delete korar api
        app.delete("/booking/:bookingId", async (req, res) => {
            const { bookingId } = req.params;


            const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) })
            res.send(result)

        })


        // Destination niye  jaowar Api

        app.get('/destination', async (req, res) => {
            const result = await destinationCollection.find().toArray()
            res.json(result);
        })


        // Form submit  Api , new destination  niye ashar api

        app.post('/destination', async (req, res) => {
            const destinationData = req.body
            const result = await destinationCollection.insertOne(destinationData)
            res.send(result)
        })

        //page details er jonno id pabo

        app.get("/destination/:id", verifyToken, async (req, res) => {
            const { id } = req.params
            const result = await destinationCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        // Edit korar api

        app.patch("/destination/:id", async (req, res) => {
            const { id } = req.params
            const updatedData = req.body
            // console.log("server update",updatedData);

            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            )
            // console.log("json live",result );

            res.send(result)
        })

        // Delete method

        app.delete("/destination/:id", async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)

        })



        // await client.db('admin').command({ ping: 1 });
        console.log("pinged your deployment, You successfully connected to MongoDB! ");

    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send(' Hello Mustafiz')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
