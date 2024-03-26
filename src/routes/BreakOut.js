import express from "express"
import { registerBreakOut } from "../controller/BreakOut.js";
const route = express.Router()

route.post('/new', registerBreakOut);

export default route