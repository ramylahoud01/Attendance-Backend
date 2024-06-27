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
import Employee from "./model/Employee.js";
import cors from "cors"
const app = express();
// CORS Configuration
app.use(cors({
    origin: '*',
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    credentials: true,
}));
app.use(bodyParser.json());

app.use('/Employee', EmployeeRoute)
app.use('/Schedule', ScheduleRoute)
app.use('/Attendance', AttendanceRoute)
app.use('/PunchIn', PunchInRoute)
app.use('/PunchOut', PunchOutRoute)
app.use('/BreakIn', BreakInRoute)
app.use('/BreakOut', BreakOutRoute)
app.use('/QrCode/:QrId', QrCodeRoute)
app.get('/', (req, res) => {
    res.send('Hello, welcome to the homepage!');
});
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
