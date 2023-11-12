const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

// zwracanie z wszystkich produktów z możliwością filtrowania i sortowania
recordRoutes.route("/products").get(async function(req, res) {
  try {
    let db_connect = dbo.getDb();
    let query = {};

    // warunki filtrowania
    if (req.query.filter) {
      try {
        const filterObj = JSON.parse(req.query.filter);
        query = { ...query, ...filterObj };
      } catch (error) {
        console.error("Error parsing filter:", error);
        return res.status(400).json({ error: "Invalid filter format" });
      }
    }

    // sortowanie
    let sortOptions = {};
    if (req.query.sortBy && req.query.sortField) {
      sortOptions[req.query.sortField] = req.query.sortBy === "desc" ? -1 : 1;
    }

    // query z uwzględnieniem filtrów i opcji sortowania
    let result = await db_connect.collection("products").find(query).sort(sortOptions).toArray();

    res.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});

// dodawanie nowego produktu ze sprawdzaniem, czy nazwa jest unikalna
recordRoutes.route("/products").post(async function(req, response){
  try {
    let db_connect = dbo.getDb();

    const existingProduct = await db_connect.collection("products").findOne({ name: req.body.name });

    if (existingProduct) {
      response.status(400).json({ error: "Product with this name already exists!" });
    } else {
      let newProduct = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        unit: req.body.unit,
      };

      const insertResult = await db_connect.collection("products").insertOne(newProduct);
      console.log("1 document added successfully");
      response.json(insertResult);
    }
  } catch (error) {
    console.error("Error adding a new product:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// edycja produktu
recordRoutes.route("/products/:id").put(async function(req, response){
  try {
    let db_connect = dbo.getDb();
    let query = { _id: new ObjectId(req.params.id) };
    let newValues = {
      $set: {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        unit: req.body.unit,
      },
    };

    let existingProduct = await db_connect.collection("products").find(query);

    if (!existingProduct) {
      console.log("Product not found");
      res.status(404).json({ error: "Product not found" });
    } else {
      let updateResult = await db_connect.collection("products").updateOne(query, newValues);
      console.log("1 document updated successfully");
      response.json(updateResult);
    }
  } catch (error) {
    console.error("Error updating a product:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

recordRoutes.route("/products/:id").delete(async function (req, res) {
  try {
    let db_connect = dbo.getDb();
    let myquery = { _id: new ObjectId(req.params.id) };

    let existingProduct = await db_connect.collection("products").findOne(myquery);
    if (!existingProduct) {
      console.log("Product not found");
      res.status(404).json({ error: "Product not found" });
    } else {
      let deleteResult = await db_connect.collection("products").deleteOne(myquery);
      console.log("1 document deleted");
      res.json(deleteResult);
    }

  } catch (error) {
    console.error("Error deleting a product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// raport stanu magazynu - liczba produktów i ich łączna wartość (price * quantity), a także osobny stan
// dla każdego produktu
recordRoutes.route("/products/report").get(async function (req, res) {
  try {
    let db_connect = dbo.getDb();

    const report = await db_connect.collection("products").aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
          products: {
            $push: {
              name: "$name",
              quantity: "$quantity",
              productValue: { $multiply: ["$quantity", "$price"] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQuantity: 1,
          totalPrice: 1,
          totalValue: { $multiply: ["$totalQuantity", "$totalPrice"] },
          products: 1,
        },
      },
    ]).toArray();

    res.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// dodatkowo: wyświetlenie jednego produktu po id
recordRoutes.route("/products/:id").get(async function(req, res) {
  try {
    let db_connect = dbo.getDb();
    let query = { _id: new ObjectId(req.params.id) };
    let result =  await db_connect.collection("products").findOne(query);
    
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: "Product does not exist" });
    }
  } catch (error) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = recordRoutes;