import express from "express"
import { displaySchedulebyId, generateScheduleFromTable, newSchedule, generateManyScheduleFromTable, displayAllSchedule } from "../controller/Schedule.js";
const route = express.Router()

route.get('/displayAll', displayAllSchedule)
route.post('/new/:EmployeeID', newSchedule);
route.get('/:EmployeeID', displaySchedulebyId)
route.post('/table/manySchedule', generateManyScheduleFromTable)
route.post('/table/:EmployeeID', generateScheduleFromTable)

export default route