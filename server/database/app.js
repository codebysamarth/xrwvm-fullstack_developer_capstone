const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3030;

app.use(cors());
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_file = fs.existsSync(path.join(__dirname, "data", "reviews.json"))
  ? path.join(__dirname, "data", "reviews.json")
  : (fs.existsSync("reviews.json") ? "reviews.json" : "./data/reviews.json");

const dealerships_file = fs.existsSync(path.join(__dirname, "data", "dealerships.json"))
  ? path.join(__dirname, "data", "dealerships.json")
  : (fs.existsSync("dealerships.json") ? "dealerships.json" : "./data/dealerships.json");

let reviews_data = { reviews: [] };
let dealerships_data = { dealerships: [] };

try {
  reviews_data = JSON.parse(fs.readFileSync(reviews_file, 'utf8'));
  dealerships_data = JSON.parse(fs.readFileSync(dealerships_file, 'utf8'));
} catch (err) {
  console.error("Error reading JSON datasets:", err);
}

const mongo_url = process.env.MONGO_URL || "mongodb://mongo_db:27017/";
mongoose.connect(mongo_url, { dbName: 'dealershipsDB' })
  .then(() => {
    console.log("Connected to MongoDB");
    const Reviews = require('./review');
    const Dealerships = require('./dealership');
    Reviews.deleteMany({}).then(() => {
      Reviews.insertMany(reviews_data['reviews']);
    });
    Dealerships.deleteMany({}).then(() => {
      Dealerships.insertMany(dealerships_data['dealerships']);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection not available, using in-memory dataset:", err.message);
  });

const Reviews = require('./review');
const Dealerships = require('./dealership');

// Express route to home
app.get('/', async (req, res) => {
  res.send("Welcome to the Mongoose API");
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const documents = await Reviews.find();
      return res.json(documents);
    }
    return res.json(reviews_data['reviews']);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const documents = await Reviews.find({ dealership: req.params.id });
      return res.json(documents);
    }
    const filtered = (reviews_data['reviews'] || []).filter(
      r => String(r.dealership) === String(req.params.id)
    );
    return res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const documents = await Dealerships.find();
      return res.json(documents);
    }
    return res.json(dealerships_data['dealerships']);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const documents = await Dealerships.find({ state: req.params.state });
      return res.json(documents);
    }
    const filtered = (dealerships_data['dealerships'] || []).filter(
      d => d.state && d.state.toLowerCase() === req.params.state.toLowerCase()
    );
    return res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const documents = await Dealerships.find({ id: req.params.id });
      return res.json(documents);
    }
    const filtered = (dealerships_data['dealerships'] || []).filter(
      d => String(d.id) === String(req.params.id)
    );
    return res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const rawData = typeof req.body === 'string' ? req.body : (req.body.toString ? req.body.toString('utf8') : JSON.stringify(req.body));
    const data = typeof rawData === 'object' ? rawData : JSON.parse(rawData);

    if (mongoose.connection.readyState === 1) {
      const documents = await Reviews.find().sort({ id: -1 });
      let new_id = (documents.length > 0 && documents[0]['id']) ? documents[0]['id'] + 1 : 1;
      const review = new Reviews({
        "id": new_id,
        "name": data['name'],
        "dealership": data['dealership'],
        "review": data['review'],
        "purchase": data['purchase'],
        "purchase_date": data['purchase_date'],
        "car_make": data['car_make'],
        "car_model": data['car_model'],
        "car_year": data['car_year'],
      });
      const savedReview = await review.save();
      return res.json(savedReview);
    } else {
      const all_revs = reviews_data['reviews'] || [];
      let new_id = 1;
      if (all_revs.length > 0) {
        new_id = Math.max(...all_revs.map(r => r.id || 0)) + 1;
      }
      const newReview = {
        "id": new_id,
        "name": data['name'],
        "dealership": Number(data['dealership']),
        "review": data['review'],
        "purchase": data['purchase'],
        "purchase_date": data['purchase_date'],
        "car_make": data['car_make'],
        "car_model": data['car_model'],
        "car_year": data['car_year'],
      };
      all_revs.push(newReview);
      return res.json(newReview);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
