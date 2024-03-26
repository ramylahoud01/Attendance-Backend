import express from "express";
import bodyParser from "body-parser";
import connectDB from "./helper/db.js";
import EmployeeRoute from "./routes/Employee.js";
import AttendanceRoute from "./routes/Attendance.js";
import PunchInRoute from "./routes/PunchIn.js";
import PunchOutRoute from "./routes/PunchOut.js";
import BreakInRoute from "./routes/BreakIn.js";
import BreakOutRoute from "./routes/BreakOut.js";
import QrCodeRoute from "./routes/QrCode.js"
import ScheduleRoute from "./routes/Schedule.js"
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-type , Authorization");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

app.use('/Employee', EmployeeRoute)
app.use('/Schedule', ScheduleRoute)
app.use('/Attendance', AttendanceRoute)
app.use('/PunchIn', PunchInRoute)
app.use('/PunchOut', PunchOutRoute)
app.use('/BreakIn', BreakInRoute)
app.use('/BreakOut', BreakOutRoute)
app.use('/QrCode/:QrId', QrCodeRoute)

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});
connectDB().then(() => {
    app.listen(5000, () => {
        console.log("Server started on port 5000");
    });
});
