import express from "express"
import { newAttendance } from "../controller/Attendance.js";
const route = express.Router()

route.post('/new', newAttendance);

export default route