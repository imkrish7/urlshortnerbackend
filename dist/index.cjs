"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/routes/shortener.routes.ts
var import_express = require("express");

// src/schema/index.ts
var import_zod = __toESM(require("zod"), 1);
var createURLSchema = import_zod.default.object({
  url: import_zod.default.url(),
  customCode: import_zod.default.string().length(10).optional(),
  email: import_zod.default.email(),
  secret: import_zod.default.string().nonoptional()
});
var validateOwnerSchema = import_zod.default.object({
  secret: import_zod.default.string().nonoptional()
});

// src/routes/shortener.routes.ts
var import_http_status_codes = require("http-status-codes");

// src/core/db.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();

// src/core/shortener.ts
var import_nanoid = require("nanoid");
var ALPHABET = "abcdef123XYZ_";
var generateShortcode = () => {
  const nanoid = (0, import_nanoid.customAlphabet)(ALPHABET, 10);
  const code = nanoid();
  return code;
};

// src/routes/shortener.routes.ts
var routes = (0, import_express.Router)();
routes.post("/create", async (req, res) => {
  try {
    const validateRequestData = createURLSchema.safeParse(req.body);
    if (!validateRequestData.success) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "URL is not valid" });
    }
    const checkURLExist = await prisma.shortenURL.findFirst({
      where: { originalURL: validateRequestData.data.url }
    });
    if (checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.CONFLICT).json({ "message": "URL already exist" });
    }
    if (validateRequestData.data.customCode) {
      const isShortenExist = await prisma.shortenURL.findFirst({
        where: { shortCode: validateRequestData.data.customCode }
      });
      if (isShortenExist) {
        return res.status(import_http_status_codes.StatusCodes.FORBIDDEN).json({ "message": "Custome code is taken" });
      }
    }
    let code = "";
    if (!validateRequestData.data.customCode) {
      code = generateShortcode();
    } else {
      code = validateRequestData.data.customCode;
    }
    const shortenURL = `${req.protocol}://${req.host}${req.baseUrl}/__redirect/${code}`;
    const createdURL = await prisma.shortenURL.create({
      data: {
        shortCode: code,
        originalURL: validateRequestData.data.url,
        clicks: 0,
        shortenURL,
        ownerEmail: validateRequestData.data.email,
        secret: validateRequestData.data.secret
      }
    });
    return res.status(import_http_status_codes.StatusCodes.CREATED).json({ "message": "url has been created successfully", data: createdURL });
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOPS! Our server is dead" });
  }
});
routes.get("/availability/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10 && code.length > 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid!" });
    }
    const checkURLExist = await prisma.shortenURL.findFirst({
      where: {
        shortCode: code
      }
    });
    if (checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ "isAvailable": false });
    }
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ "isAvailable": true });
  } catch (error) {
    console.log(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.get("/all", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const shortenURLs = await prisma.shortenURL.findMany({
      skip,
      take: parseInt(limit),
      select: {
        ownerEmail: true,
        shortCode: true,
        shortenURL: true,
        originalURL: true,
        clicks: true
      }
    });
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ data: shortenURLs });
  } catch (error) {
    console.log(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.post("/validate/:code/owner", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid" });
    }
    const validateRequestData = validateOwnerSchema.safeParse(req.body);
    if (!validateRequestData.success) {
      return res.status(import_http_status_codes.StatusCodes.UNAUTHORIZED).json({ "message": "Unuahtorized" });
    }
    const checkURLExist = await prisma.shortenURL.findUnique({
      where: {
        shortCode: code
      }
    });
    if (!checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" });
    }
    if (checkURLExist.secret !== validateRequestData.data.secret) {
      return res.status(import_http_status_codes.StatusCodes.UNAUTHORIZED).json({ "message": "Unuahtorized" });
    }
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ "message": "authorized" });
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.put("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid" });
    }
    const validateRequestData = createURLSchema.safeParse(req.body);
    if (!validateRequestData.success) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "URL is not valid" });
    }
    const checkURLExist = await prisma.shortenURL.findUnique({
      where: {
        shortCode: code
      }
    });
    if (!checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" });
    }
    const editURL = await prisma.shortenURL.update({
      where: { shortCode: code },
      data: {
        ownerEmail: validateRequestData.data.email,
        originalURL: validateRequestData.data.url,
        secret: validateRequestData.data.secret
      }
    });
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ "message": "edited" });
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid" });
    }
    const checkURLExist = await prisma.shortenURL.findUnique({
      where: {
        shortCode: code
      }
    });
    if (!checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" });
    }
    const deleteURL = await prisma.shortenURL.delete({
      where: { shortCode: code }
    });
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ "message": "URL deleted" });
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid" });
    }
    const checkURLExist = await prisma.shortenURL.findUnique({
      where: {
        shortCode: code
      }
    });
    if (!checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" });
    }
    return res.status(import_http_status_codes.StatusCodes.ACCEPTED).json({ data: checkURLExist });
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});
routes.get("/__redirect/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 10) {
      return res.status(import_http_status_codes.StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid" });
    }
    const checkURLExist = await prisma.shortenURL.findUnique({
      where: {
        shortCode: code
      }
    });
    if (!checkURLExist) {
      return res.status(import_http_status_codes.StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" });
    }
    const _updateClicks = await prisma.shortenURL.update({
      where: { shortCode: code },
      data: {
        clicks: checkURLExist.clicks + 1
      }
    });
    return res.redirect(checkURLExist.originalURL);
  } catch (error) {
    console.error(error);
    return res.status(import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR).json({ "message": "OOP! Our server is dead" });
  }
});

// src/index.ts
var PORT = process.env.PORT || 8080;
var app = (0, import_express2.default)();
app.use(import_express2.default.json());
app.use((0, import_cors.default)());
app.use("/shortener", routes);
app.listen(PORT, () => {
  console.log("Server is running on: ", PORT);
});
