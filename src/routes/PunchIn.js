import express from "express"
import { registerPunchIn } from "../controller/PunchIn.js";
const route = express.Router()

route.post('/new', registerPunchIn);

export default route