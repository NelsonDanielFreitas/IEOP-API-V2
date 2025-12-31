const express = require("express");
const clientsController = require("../controllers/clients.controller");

const router = express.Router();

// Criar um carro no Vendus
router.post("/", clientsController.createClientInVendus);

module.exports = router;
