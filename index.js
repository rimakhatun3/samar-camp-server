const express = require('express');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_STRIPE_KEY)

app.use(express.json())
app.use(cors())


const verifyJwt =(req,res,next)=>{
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({error:true, message:"unathorization access"})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token,process.env.JWT_ACCESS_TOKEN,(error,decoded)=>{
    if(error){
      return res.status(401).send({error:true, message:"unathorization access"})
    }
req.decoded = decoded
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
    // await client.connect();
const usersCollection = client.db('summercamp').collection('users')
const classCollection = client.db('summercamp').collection('classes')
const studentCollection = client.db('summercamp').collection('student')
const paymentsCollection = client.db('summercamp').collection('payment')


// users api


app.post('/jwt',(req,res)=>{
  const user = req.body
  const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN,{expiresIn:'5h'})
  res.send({token})
})

const verifyAdmin =async(req,res,next)=>{
  const email = req.decoded.email
  const query = {email:email}
  const user = await usersCollection.findOne(query)
  if(user.role!=="admin"){
    return res.status(403).send({error:true,message:"forbidden message"})
  }
next()
}

const verifyInstructor =async(req,res,next)=>{
  const email = req.decoded.email
  const query = {email:email}
  const user = await usersCollection.findOne(query)
  if(user.role!=="instructor"){
    return res.status(403).send({error:true,message:"forbidden message"})
  }
next()
}


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

// get admin

app.get('/user/admin/:email',verifyJwt,async(req,res)=>{
  const email = req.params.email
  if(req.decoded.email!==email){
    return  res.send({admin:false})
    }
  const query = {email :email}
  const user = await usersCollection.findOne(query)
  const result = {admin:user.role==="admin"}

res.send(result)
})

// // get student

// app.get('/user/student/:email',verifyJwt,async(req,res)=>{
//   const email = req.params.email
//   if(req.decoded.email!==email){
//     return  res.send({student:false})
//     }
//   const query = {email :email}
//   const user = await usersCollection.findOne(query)
//   const result = {student:user.role==="student"}

// res.send(result)
// })


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

// get instructor
app.get('/user/instructor/:email',verifyJwt,async(req,res)=>{
  const email = req.params.email
  if(req.decoded.email!==email){
    return  res.send({instructor:false})
    }
  const query = {email :email}
  const user = await usersCollection.findOne(query)
  const result = {instructor:user.role==="instructor"}

res.send(result)
})


// add get classes api

app.post('/addclass',async(req,res)=>{
  const body = req.body;
  const result = await classCollection.insertOne(body)
  res.send(result)
})

app.get('/allclasses',async(req,res)=>{
  const result = await classCollection.find().toArray()
  res.send(result)
})
app.get('/feedbackclass/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const result = await classCollection.findOne(query)

  res.send(result)
})


app.get('/allclasse/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const result = await studentCollection.findOne(query)
  res.send(result)
})



app.patch('/feedback/:id',async(req,res)=>{
  const id = req.params.id
  const feedback = req.body
  const query = {_id : new ObjectId(id)}
  const updateDoc ={
    $set:{
      feedback:feedback
    }
  }
  const result = await classCollection.updateOne(query,updateDoc)
  res.send(result)
})



app.patch('/allclass/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const updateDoc ={
    $set:{
      status:'approve'
    }
  }
  const result = await classCollection.updateOne(query,updateDoc)
  res.send(result)
})


app.patch('/classdeny/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const updateDoc ={
    $set:{
      status:'denied'
    }
  }
  const result = await classCollection.updateOne(query,updateDoc)
  res.send(result)
})

// student select classes api
app.post('/selectedclasses',async(req,res)=>{
  const student = req.body
  const result = await studentCollection.insertOne(student)
  res.send(result)
})

app.get('/selectclass',async(req,res)=>{
  const result = await studentCollection.find().toArray()
  res.send(result)
})

app.delete('/selectedclass/:id',async(req,res)=>{
const id = req.params.id
const query ={_id: new ObjectId(id)}
const result = await studentCollection.deleteOne(query)
res.send(result)
})

// payment apis
app.post('/create-payment-intent',verifyJwt,async(req,res)=>{
 const {price} = req.body
 
 const amount = parseInt(price*100)
 
 const paymentIntent = await stripe.paymentIntents.create({
  amount:amount,
  currency: "usd",
  payment_method_types:['card']
  
 })
 res.send({
  clientSecret:paymentIntent.client_secret
})
})

app.post('/payment',async(req,res)=>{
  const payment = req.body
  const result = await paymentsCollection.insertOne(payment)
  const query = {_id: new ObjectId(payment.classId) }
  const deleteResult = await studentCollection.deleteOne(query)
  // const seat = {seat:payment.seat}
  // const updateResult = await classCollection.updateOne(query) 
  res.send({result,deleteResult})
})

app.get('/enrollclass',async(req,res)=>{
  const result = await paymentsCollection.find().toArray()
  res.send(result)
})




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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