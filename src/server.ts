import dotenv from "dotenv";
import { env } from "./config/env.js";
dotenv.config();
import app from "./app.js";




app.listen(env.PORT,()=>{
    console.log(`Server Running on port ${env.PORT}`);
    
})