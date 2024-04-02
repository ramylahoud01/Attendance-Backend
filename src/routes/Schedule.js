import express from "express"
import { displaySchedulebyId, newSchedule } from "../controller/Schedule.js";
const route = express.Router()

route.post('/new/:EmployeeID', newSchedule);
route.get('/:EmployeeID', displaySchedulebyId)

export default route