import { customAlphabet } from "nanoid"


const ALPHABET = "abcdef123XYZ_"

export const generateShortcode = (): string => {
    const nanoid = customAlphabet(ALPHABET, 10);
    const code = nanoid();
    return code;
}