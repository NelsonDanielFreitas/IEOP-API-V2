const productsService = require("../services/products.service");

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await productsService.fetchAllProducts();
    return res.status(200).json({ ok: true, data: products });
  } catch (error) {
    return next(error);
  }
};

exports.createCarInVendus = async (req, res, next) => {
  try {
    const carData = req.body;
    const newCar = await productsService.createCarInVendus(carData);
    return res.status(201).json({ ok: true, data: newCar });
  } catch (error) {
    return next(error);
  }
};
