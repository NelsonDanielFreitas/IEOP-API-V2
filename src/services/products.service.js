const { env } = require("../config/env");

const BASE_URL_VENDUS = "https://www.vendus.pt/ws/v1.1/products";

function buildVendusRequest() {
  if (!env.vendusApiKey) {
    const err = new Error("Missing VENDUS_API_KEY");
    err.status = 500;
    err.code = "CONFIG_MISSING";
    throw err;
  }

  const url = new URL(BASE_URL_VENDUS);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${env.vendusApiKey}`,
  };

  return { url, headers };
}

async function fetchAllProducts() {
  const { url, headers } = buildVendusRequest();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    const rawText = await response.text();
    const body = rawText ? safeJsonParse(rawText) : null;

    if (!response.ok) {
      const err = new Error("Vendus request failed");
      err.status = response.status;
      err.code = "VENDUS_ERROR";
      err.details = body;
      throw err;
    }

    const vendusProducts = normalizeVendusProducts(body);

    //Aqui faz o mapeamento para stocks superiores a -1
    return vendusProducts
      .map(mapVendusProductToEssential)
      .filter((p) => typeof p.stock === "number" && p.stock > -1);
  } catch (error) {
    if (error?.name === "AbortError") {
      const err = new Error("Vendus request timeout");
      err.status = 504;
      err.code = "VENDUS_TIMEOUT";
      throw err;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Cria um carro/produto no Vendus.
async function createCarInVendus(carData) {
  // Validar categoria e marca
  const [categoryData, brandData] = await Promise.all([
    validateCategory(carData.category),
    validateBrand(carData.brand),
  ]);

  // Validar unidade (para obter unit_id)
  const unitTitle = "Uni";
  const unitData = await validateUnit(unitTitle);

  // Definir referência

  let reference = carData.reference;
  if (reference) {
    const existing = await checkProductExists(reference);
    if (existing) {
      const err = new Error(
        `Produto com referência '${reference}' já existe no Vendus`
      );
      err.status = 409;
      err.code = "PRODUCT_ALREADY_EXISTS";
      err.details = {
        id: existing.id,
        reference: existing.reference,
        title: existing.title,
      };
      throw err;
    }
  } else {
    reference = await generateUniqueReference({ carData, brandData });
  }

  // Montar payload base
  const payload = {
    reference,
    title: buildProductTitle(carData),
    category_id: categoryData.id,
    brand_id: brandData.id,
    unit_id: unitData.id,
    status: "on",
    type_id: "P",
    stock_control: "1",
    stock_type: "M",
    tax_id: carData.tax_id || "NOR",
  };

  // Campos opcionais
  if (carData.description) payload.description = carData.description;
  if (carData.supply_price != null)
    payload.supply_price = String(carData.supply_price);
  if (carData.gross_price != null)
    payload.gross_price = String(carData.gross_price);
  if (carData.tax_exemption) payload.tax_exemption = carData.tax_exemption;

  // TODO: Imagem (a implementar)
  // if (carData.image) {
  //   payload.image = await processImage(carData.image);
  // }

  // Enviar para a Vendus
  return sendCreateProductRequest(payload);
}

// Gera uma referência com base na marca + matrícula e garante que é única.
// Exemplo: CAR-RENAULT-AA00BB
async function generateUniqueReference({ carData, brandData }) {
  const base = generateReferenceBase({ carData, brandData });

  for (let i = 0; i < 10; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await checkProductExists(candidate);
    if (!existing) return candidate;
  }

  const suffix = String(Date.now()).slice(-5);
  return `${base}-${suffix}`;
}

function generateReferenceBase({ carData, brandData }) {
  const brandPart = normalizeReferencePart(
    brandData?.title || carData.brand || "CAR"
  );
  const platePart = normalizeReferencePart(carData.license_plate || "");

  if (!platePart) {
    const titlePart = normalizeReferencePart(carData.title || "").slice(0, 10);
    const suffix = String(Date.now()).slice(-4);
    return `CAR-${brandPart}-${titlePart || "ITEM"}-${suffix}`.slice(0, 32);
  }

  return `CAR-${brandPart}-${platePart}`.slice(0, 32);
}

function normalizeReferencePart(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 16);
}

// Constrói o título do produto (carro).
function buildProductTitle(carData) {
  const base = carData.title || "Sem título";
  return carData.license_plate
    ? `${base} (Matrícula: ${carData.license_plate})`
    : base;
}

// Envia o pedido POST para criar produto na Vendus.
async function sendCreateProductRequest(payload) {
  const { headers } = buildVendusRequest();

  const response = await fetch(BASE_URL_VENDUS, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const body = safeJsonParse(text);

  if (!response.ok) {
    const err = new Error(
      `Falha ao criar produto no Vendus (${response.status})`
    );
    err.status = response.status;
    err.code = "VENDUS_CREATE_FAILED";
    err.details = body;
    throw err;
  }

  return body;
}

// Verifica se já existe um produto com a referência indicada.
async function checkProductExists(reference) {
  const { headers } = buildVendusRequest();
  const url = `${BASE_URL_VENDUS}?reference=${encodeURIComponent(reference)}`;

  try {
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) return null;

    const products = await res.json();
    if (!Array.isArray(products)) return null;

    return products.find((p) => p.reference === reference) || null;
  } catch {
    return null;
  }
}

// Valida se a categoria existe na Vendus.
async function validateCategory(categoryTitle) {
  const { headers } = buildVendusRequest();
  const url = "https://www.vendus.pt/ws/v1.1/products/categories";

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const err = new Error(`Falha ao obter categorias (${res.status})`);
    err.status = res.status;
    err.code = "VENDUS_CATEGORIES_FAILED";
    throw err;
  }

  const categories = await res.json();
  const found = categories.find(
    (c) => c.title.toLowerCase() === categoryTitle.toLowerCase()
  );

  if (!found) {
    const err = new Error(`Categoria '${categoryTitle}' não encontrada`);
    err.status = 404;
    err.code = "CATEGORY_NOT_FOUND";
    err.details = { available: categories.map((c) => c.title) };
    throw err;
  }

  return found;
}

// Valida se a marca existe na Vendus.
async function validateBrand(brandTitle) {
  const { headers } = buildVendusRequest();
  const url = "https://www.vendus.pt/ws/v1.1/products/brands";

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const err = new Error(`Falha ao obter marcas (${res.status})`);
    err.status = res.status;
    err.code = "VENDUS_BRANDS_FAILED";
    throw err;
  }

  const brands = await res.json();
  console.log(brands);
  const found = brands.find(
    (b) => b.title.toLowerCase() === brandTitle.toLowerCase()
  );

  if (!found) {
    const err = new Error(`Marca '${brandTitle}' não encontrada`);
    err.status = 404;
    err.code = "BRAND_NOT_FOUND";
    err.details = { available: brands.map((b) => b.title) };
    throw err;
  }

  return found;
}

function normalizeVendusProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;

  return [];
}

function mapVendusProductToEssential(product) {
  const grossPrice = coerceNumber(
    product?.gross_price ?? product?.prices?.[0]?.price
  );
  const priceWithoutTax = coerceNumber(
    product?.price_without_tax ?? product?.prices?.[0]?.price_without_tax
  );

  const stock =
    coerceNumber(product?.stock) ??
    coerceNumber(product?.compound?.stock?.stock) ??
    null;

  const imageUrl = product?.images?.m || product?.images?.xs || null;

  return {
    id: product?.id ?? null,
    reference: product?.reference || null,
    title: product?.title || null,
    description: product?.description || null,
    grossPrice,
    priceWithoutTax,
    stock,
    status: product?.status || null,
    imageUrl,
  };
}

function coerceNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function validateUnit(unitTitle = "Uni") {
  const { headers } = buildVendusRequest();
  const url = "https://www.vendus.pt/ws/v1.1/products/units";

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const err = new Error(`Falha ao obter unidades (${res.status})`);
    err.status = res.status;
    err.code = "VENDUS_UNITS_FAILED";
    throw err;
  }

  const units = await res.json();
  const found = units.find(
    (u) => u.title.toLowerCase() === unitTitle.toLowerCase()
  );

  if (!found) {
    const err = new Error(`Unidade '${unitTitle}' não encontrada`);
    err.status = 404;
    err.code = "UNIT_NOT_FOUND";
    err.details = { available: units.map((u) => u.title) };
    throw err;
  }

  return found;
}

module.exports = {
  fetchAllProducts,
  createCarInVendus,
};
