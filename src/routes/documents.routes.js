const express = require("express");
const documentsController = require("../controllers/documents.controller");

const router = express.Router();

// Obter todos os documentos
router.get("/", documentsController.getAllDocumentsVendus);

// Criar um documento no Vendus
router.post("/", documentsController.createDocumentInVendus);
module.exports = router;
