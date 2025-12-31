const express = require("express");
const productsController = require("../controllers/products.controller");

const router = express.Router();

// Obter todos os produtos que neste caso são os carros
router.get("/", productsController.getAllProducts);

// Criar um carro no Vendus
router.post("/", productsController.createCarInVendus);
module.exports = router;
