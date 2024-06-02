import express from "express"
import { displaySchedulebyId, generateScheduleFromTable, newSchedule, generateManyScheduleFromTable, displayAllSchedule, generateScheduleForReports, displaySummaryReport } from "../controller/Schedule.js";
const route = express.Router()

route.post('/reports', generateScheduleForReports)
route.get('/displayAll', displayAllSchedule)
route.post('/new/:EmployeeID', newSchedule);
route.get('/:EmployeeID', displaySchedulebyId)
route.post('/table/manySchedule', generateManyScheduleFromTable)
route.post('/table/:EmployeeID', generateScheduleFromTable)
route.get('/display/summaryReport', displaySummaryReport)

export default route