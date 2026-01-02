const documentsService = require("../services/documents.service");

exports.getAllDocumentsVendus = async (req, res, next) => {
  try {
    const documents = await documentsService.getAllDocumentsVendus();
    return res.status(200).json({ ok: true, data: documents });
  } catch (error) {
    return next(error);
  }
};

exports.createDocumentInVendus = async (req, res, next) => {
  try {
    const documentData = req.body;
    const newDocument = await documentsService.createDocumentInVendus(
      documentData
    );
    return res.status(201).json({ ok: true, data: newDocument });
  } catch (error) {
    return next(error);
  }
};
