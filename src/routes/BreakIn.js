import express from "express"
import { registerBreakIn } from "../controller/BreakIn.js";
const route = express.Router()

route.post('/new', registerBreakIn);

export default route