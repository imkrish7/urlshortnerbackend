import z from "zod";

export const createURLSchema = z.object({
    url: z.url(),
    customCode: z.string().length(10).optional(),
    email: z.email(),
    secret: z.string().nonoptional(),
})

export const validateOwnerSchema = z.object({
    secret: z.string().nonoptional(),
})