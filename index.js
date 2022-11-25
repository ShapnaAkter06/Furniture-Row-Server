const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlhnchw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('furnitureRow').collection('categories');
        const allCategoriesCollection = client.db('furnitureRow').collection('allCategories');
        const bookingsCollection = client.db("furnitureRow").collection("bookings");

        //get categories
        app.get('/categories', async(req, res)=>{
            const query = {}
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories)
        })

        // all categories
        app.get('/allCategories/:id', async (req, res) => {
            const id = req.query.category_id;
            let query = { id }
            const cursor = allCategoriesCollection.find(query);
            const allCategories = await cursor.toArray();
            res.send(allCategories)
        })

        //Bookings API
        app.post('/bookings', async (req, res) => {
            const booking= req.body;
            const query = {
                product: booking.product,
                email: booking.email,
                productPrice: booking.productPrice
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You have already booked on ${booking.product}`;
                return res.send({ acknowledged: false, message });
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        //Get My Bookings Data API
        app.get('/bookings', async(req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })


    } finally {
        
    }
}
run().catch(err => console.log(err));


app.get('/', async (req, res) => {
    res.send('server is running');
})

app.listen(port, async (req, res) => {
    console.log(`Server is running on port ${port}`);
})