import express from "express"
import { fetchPunchIns, registerPunchIn } from "../controller/PunchIn.js";
const route = express.Router()

route.post('/new', registerPunchIn);
route.get('/', fetchPunchIns)
export default route