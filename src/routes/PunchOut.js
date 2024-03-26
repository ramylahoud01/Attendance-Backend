import express from "express"
import { registerPunchOut } from "../controller/PunchOut.js";
const route = express.Router()

route.post('/new', registerPunchOut);

export default route