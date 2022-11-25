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
    // JWT authentication
    function verifyJWT(req, res, next) {

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send('unauthorized access');
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            req.decoded = decoded;
            next();
        })

    }

    try {
        const categoriesCollection = client.db('furnitureRow').collection('categories');
        const allCategoriesCollection = client.db('furnitureRow').collection('allCategories');
        const bookingsCollection = client.db("furnitureRow").collection("bookings");
        const usersCollection = client.db("furnitureRow").collection("users");
        const productsCollection = client.db("furnitureRow").collection("products");

        //get categories
        app.get('/categories', async (req, res) => {
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

        //Create Bookings API
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
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
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        //Add Users in Db
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get users
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        // add product in DB
        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            res.send(result)
        });

        // get all products from DB
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        })

        // delete products
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result)
        })

        //JWT Token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ accessToken: '' });
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