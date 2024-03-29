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
app.use(cors())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://attendance-frontend-on5kxko1c-ramylahoud01s-projects.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
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
app.get('/test', async (req, res) => {
    try {
        const employee = await Employee.findOne({});
        console.log('Employee', employee);
        res.status(200).json({ message: 'This is a test route,new test 123', employee });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
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
