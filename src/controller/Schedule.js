import Attendance from "../model/Attendance.js";
import Schedule from "../model/Schedule.js";


export const newSchedule = async (req, res, next) => {
    try {
        const { FromDate, ToDate } = req.body;
        const { EmployeeID } = req.params;
        const attendance = new Attendance({
            EmployeeID,
            FromDate,
            ToDate
        });
        const savedAttendance = await attendance.save();
        console.log(new Date(FromDate))
        console.log(ToDate)
        const schedule = new Schedule({
            EmployeeID,
            AttendanceID: savedAttendance._id,
            FromDate,
            ToDate
        });

        const savedSchedule = await schedule.save();

        // Update savedAttendance to include ScheduleId
        savedAttendance.ScheduleID = savedSchedule._id;
        await savedAttendance.save();

        // Construct event objects to be returned
        const event = {
            EmployeeID,
            AttendanceID: savedAttendance._id,
            FromDate: FromDate,
            ToDate: ToDate,
            allDay: false
        };

        // Return the event data along with the response
        res.status(201).json({ savedSchedule, savedAttendance, event });
    } catch (error) {
        next(error);
    }
};


export const displaySchedulebyId = async (req, res, next) => {
    try {
        const { EmployeeID } = req.params;
        const foundSchedules = await Schedule.find({ EmployeeID })
        res.status(200).json({ foundSchedules })
    }
    catch (error) {
        next(error)
    }
}