import z from "zod";


export const createURLSchema = z.object({
	url: z
		.url()
		.refine(
			(val) => {
				try {
					const u = new URL(val);
					// Require at least one dot in the hostname
					
					if (
						((u.hostname.includes(".") &&
                            !u.hostname.endsWith(".") &&
							u.hostname.split(".")[1]!.length >= 2) ||
							((u.hostname === "localhost" ||
								u.hostname === "127.0.0.1" ||
								u.hostname === "::1") &&
								!u.hostname.endsWith(":") &&
								u.port.length > 0)) &&
						(u.protocol === "http:" || u.protocol === "https:")
					) {
						return true;
					}
				} catch {
					return false;
				}
			},
			{
				message:
					"Invalid URL — must include a valid domain (e.g. example.com)",
			}
		),
	email: z.email(),
	customCode: z.string().refine(
		(val) => {
			if (val.length === 0 || val.length === 10) {
				return true;
			} else if (val.length > 10 || val.length < 10) {
				return false;
			}
		},
		{ error: "Invalid, It should be 10 character long" }
	).optional(),
	secret: z.string().min(6),
});

export const validateOwnerSchema = z.object({
    secret: z.string().nonoptional(),
})