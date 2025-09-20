import { Router, type Request, type Response } from "express";
import { createURLSchema, validateOwnerSchema } from "../schema/index.ts";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../core/db.ts";
import { generateShortcode } from "../core/shortener.ts";
import type { IPagination } from "../types/index.ts";
import type { Prisma, ShortenURL } from "@prisma/client";
import { boolean } from "zod";

const routes = Router();


routes.post("/create", async (req: Request, res: Response) => {
    try {
        const validateRequestData = createURLSchema.safeParse(req.body);
        
        if (!validateRequestData.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({ "message": "URL is not valid" })
        }

        const checkURLExist = await prisma.shortenURL.findFirst({
            where: {originalURL: validateRequestData.data.url}
        })

        if (checkURLExist) {
            return res.status(StatusCodes.CONFLICT).json({ "message": "URL already exist" });
        }

        if (validateRequestData.data.customCode) {
            const isShortenExist = await prisma.shortenURL.findFirst({
                where: { shortCode: validateRequestData.data.customCode }
            })
            if (isShortenExist) {
                return res.status(StatusCodes.FORBIDDEN).json({"message": "Custome code is taken"})
            }
        }

        let code: string = ""
        if (!validateRequestData.data.customCode) {
            code = generateShortcode();
        } else {
            code = validateRequestData.data.customCode
        }
        const shortenURL = `${req.protocol}://${req.host}${req.baseUrl}/__redirect/${code}`
        const createdURL = await prisma.shortenURL.create({
            data: {
                shortCode: code,
                originalURL: validateRequestData.data.url,
                clicks: 0,
                shortenURL,
                ownerEmail: validateRequestData.data.email,
                secret: validateRequestData.data.secret
            }
        })

        return res.status(StatusCodes.CREATED).json({ "message": "url has been created successfully", data: createdURL })
        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOPS! Our server is dead"})
    }
})

routes.get("/availability/:code", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;

        if (!code || (code.length < 10 && code.length > 10)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ "message": "Code is not valid!" })
        }

        const checkURLExist = await prisma.shortenURL.findFirst({
            where: {
                shortCode: code
            }
        })

        if (checkURLExist) {
            return res.status(StatusCodes.ACCEPTED).json({"isAvailable": false})
        }

        return res.status(StatusCodes.ACCEPTED).json({"isAvailable": true})
        
    } catch (error) {
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})


routes.get("/all", async (req: Request<{}, {}, {}, IPagination>, res: Response) => {
    try {
        const { page, limit, cursor, farword} = req.query
        const pageNumber = parseInt(page) > 0 && !isNaN(parseInt(page))? parseInt(page) : 1;
        const offset = parseInt(limit) > 0 && !isNaN(parseInt(limit))? parseInt(limit) : 10;
        const skip = (pageNumber - 1) * offset;

        let isFarword = true;
        if (farword === "true" || farword === "false") {
            isFarword = Boolean(farword);
        }

        let query: Prisma.ShortenURLFindManyArgs= {
            skip,
            take: isFarword? offset: -(offset),
            select: {
                ownerEmail: true,
                shortCode: true,
                shortenURL: true,
                originalURL: true,
                clicks: true,
                id: true
            }
        }
        if (cursor) {
            query["skip"] = 1;
           query["cursor"] = {"id": cursor}
        }
        
        const shortenURLs = await prisma.shortenURL.findMany(query);

        let nextCursor = null;

        if (shortenURLs !== undefined && shortenURLs.length > 0) {
            nextCursor = shortenURLs[shortenURLs.length-1]?.id;
        }

        return res.status(StatusCodes.ACCEPTED).json({data: shortenURLs, cursor: nextCursor})

    } catch (error) {
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})

routes.post("/validate/:code/owner", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;

        if (!code || code.length < 10) {
            return res.status(StatusCodes.BAD_REQUEST).json({"message": "Code is not valid"})
        }

        const validateRequestData = validateOwnerSchema.safeParse(req.body);

        if (!validateRequestData.success) {
            return res.status(StatusCodes.UNAUTHORIZED).json({"message": "Unuahtorized"})
        }

        const checkURLExist = await prisma.shortenURL.findUnique({
            where: {
                shortCode: code
            }
        })

        if (!checkURLExist) {
            return res.status(StatusCodes.NOT_FOUND).json({"message": "URL does not exist"})
        }

        if (checkURLExist.secret !== validateRequestData.data.secret) {
            return res.status(StatusCodes.UNAUTHORIZED).json({"message": "Unuahtorized"})
        }
        return res.status(StatusCodes.ACCEPTED).json({"message": "authorized"});

        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})

routes.put("/:code", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;
        
        if (!code || code.length < 10) {
            return res.status(StatusCodes.BAD_REQUEST).json({"message": "Code is not valid"})
        }

        const validateRequestData = createURLSchema.safeParse(req.body);
        
        if (!validateRequestData.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({ "message": "URL is not valid" })
        }

        const checkURLExist = await prisma.shortenURL.findUnique({
            where: {
                shortCode: code
            }
        })

        if (!checkURLExist) {
            return res.status(StatusCodes.NOT_FOUND).json({"message": "URL does not exist"})
        }

        const editURL = await prisma.shortenURL.update({
            where: { shortCode: code },
            data: {
                ownerEmail: validateRequestData.data.email,
                originalURL: validateRequestData.data.url,
                secret: validateRequestData.data.secret
            }
        })

        return res.status(StatusCodes.ACCEPTED).json({"message": "edited"});

        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})


routes.delete("/:code", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;

        if (!code || code.length < 10) {
            return res.status(StatusCodes.BAD_REQUEST).json({"message": "Code is not valid"})
        }

        const checkURLExist = await prisma.shortenURL.findUnique({
            where: {
                shortCode: code
            }
        })

        if (!checkURLExist) {
            return res.status(StatusCodes.NOT_FOUND).json({"message": "URL does not exist"})
        }

        const deleteURL = await prisma.shortenURL.delete({
            where: {shortCode: code}
        })

        return res.status(StatusCodes.ACCEPTED).json({"message": "URL deleted"});

        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})

routes.get("/:code", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;

        if (!code || code.length < 10) {
            return res.status(StatusCodes.BAD_REQUEST).json({"message": "Code is not valid"})
        }

        const checkURLExist = await prisma.shortenURL.findUnique({
            where: {
                shortCode: code
            }
        })

        if (!checkURLExist) {
            return res.status(StatusCodes.NOT_FOUND).json({"message": "URL does not exist"})
        }

        return res.status(StatusCodes.ACCEPTED).json({data: checkURLExist});

        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})


routes.get("/__redirect/:code", async (req: Request, res: Response) => {
    try {

        const { code } = req.params;

        if (!code || code.length < 10) {
            return res.status(StatusCodes.BAD_REQUEST).json({"message": "Code is not valid"})
        }

        const checkURLExist = await prisma.shortenURL.findUnique({
            where: {
                shortCode: code
            }
        })

        if (!checkURLExist) {
            return res.status(StatusCodes.NOT_FOUND).json({ "message": "URL does not exist" })
        }

        const _updateClicks = await prisma.shortenURL.update({
            where: { shortCode: code },
            data: {
                clicks: checkURLExist.clicks+1
            }
        })

        return res.redirect(checkURLExist.originalURL);

        
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({"message": "OOP! Our server is dead"})
    }
})


export {
    routes
}