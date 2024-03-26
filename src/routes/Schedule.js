import express from "express"
import { newSchedule } from "../controller/Schedule.js";
const route = express.Router()

route.post('/new/:EmployeeID', newSchedule);

export default route