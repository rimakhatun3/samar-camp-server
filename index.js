const express = require('express');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

app.use(express.json())
app.use(cors())

const verifyJwt =(req,res,next)=>{
  const authoraization = req.headers.authoraization
  if(!authoraization){
    return res.status(403).send({error:true, message:"unathorization access"})
  }
  const token = authoraization.spilt(' ')[1]
  jwt.verify(token,process.env.JWT_ACCESS_TOKEN,(error,decoded)=>{
    if(error){
      return res.status(403).send({error:true, message:"unathorization access"})
    }
req.decodede = decoded
next()
  })
}

// console.log(process.env.JWT_ACCESS_TOKEN)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wvicmmt.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
const usersCollection = client.db('summercamp').collection('users')


// users api


app.post('/jwt',(req,res)=>{
  const user = req.body
  const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN,{expiresIn:'5h'})
  res.send({token})
})

app.put('/allUser/:email',async(req,res)=>{
    const users = req.body;
    const email = req.params.email
    const query = {email:email}
    const options = { upsert: true }
    const updateDoc={
        $set:users
    }

    const result = await usersCollection.updateOne(query,updateDoc,options)
    res.send(result)
})

app.get('/allusers',async(req,res)=>{
    const result = await usersCollection.find().toArray()
    res.send(result)
})

app.patch('/alluser/admin/:id',async(req,res)=>{
const id = req.params.id
const query = {_id : new ObjectId(id)}
const updateDoc ={
  $set:{
    role:"admin"
  }
}
const result = await usersCollection.updateOne(query,updateDoc)
res.send(result)
})
app.patch('/alluser/instructor/:id',async(req,res)=>{
const id = req.params.id
const query = {_id : new ObjectId(id)}
const updateDoc ={
  $set:{
    role:"instructor"
  }
}
const result = await usersCollection.updateOne(query,updateDoc)
res.send(result)
})





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('server is running')
})


app.listen(port,()=>{
    console.log(`port is running on :${port}`)
})