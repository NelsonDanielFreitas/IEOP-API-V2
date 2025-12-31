const clientsService = require("../services/clients.service");

exports.createClientInVendus = async (req, res, next) => {
  try {
    const clientData = req.body;
    const newClient = await clientsService.createClientInVendus(clientData);
    return res.status(201).json({ ok: true, data: newClient });
  } catch (error) {
    return next(error);
  }
};
