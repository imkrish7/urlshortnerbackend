import "dotenv/config"
import express from "express"
import cors from "cors"

import { routes as shortenerRoutes } from "./routes/shortener.routes.ts";


const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cors())


app.use("/shortener", shortenerRoutes)

app.listen(PORT, () => {
    console.log("Server is running on: ", PORT)
})


