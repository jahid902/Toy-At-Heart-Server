const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

// mongodb connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ee0rgus.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
     client.connect();
    const toysCollection = client.db('allToys').collection('Toy');

    // indexing for search

    const indexKeys = { toyName: 1, category: 1 };
    const indexOptions = { name: "toyNameCategory" };
    const result = await toysCollection.createIndex(indexKeys, indexOptions);
    
    // single toy post route

    app.post('/addToy', async (req, res) => {
        const addToy = req.body;
        const result = await toysCollection.insertOne(addToy);
        res.send(result);
    });

    // all toy get route

    app.get('/allToys', async(req,res) =>{
      const toys = await toysCollection.find({}).limit(20).toArray();
      // added limit to 20 for toys get operation 
      res.send(toys);
    })

    // toy view detail get route toy/:id 

    app.get('/toy/:id', async(req,res)=> {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const toy = await toysCollection.findOne(query);
      res.send(toy);
    })

    // get route for category wise data loading

    app.get("/toysCategory/:category", async (req, res) => {
      const toys = await toysCollection
        .find({
          category: req.params.category,
        })
        .limit(2)
        .sort({quantity: 1})
        .toArray();
      res.send(toys);
    });

    // Email users posted toy data get route

    app.get("/toys", async (req,res)=>{
      const email = req.query?.email;
      let query = {};
      if(email){
          query = {email : email}
      }
      const result = await toysCollection.find(query).sort({price : -1}).toArray()
      res.send(result);
    })

    // update toy patch route

    app.patch("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedToy = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description
        },
      };
      const result = await toysCollection.updateOne(query, updatedToy);
      res.send(result);
    });

    // Search route for all toys

    app.get("/toyText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toysCollection
        .find({
          $or: [
            { toyName: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    // Db toy delete route

    app.delete('/toyDlt/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toysCollection.deleteOne(query);
      res.send(result);
  })


    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {  
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req,res)=>{
    res.send("toy server is running");
})

app.listen(port, ()=>{
    console.log(`server is running on port : ${port}`);
})