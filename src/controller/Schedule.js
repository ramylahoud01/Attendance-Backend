import Attendance from "../model/Attendance.js";
import Schedule from "../model/Schedule.js";


export const newSchedule = async (req, res, next) => {
    try {
        const { FromToHours, Time } = req.body;
        const { EmployeeID } = req.params;

        const currentDate = new Date();
        const startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            0,
            0,
            0
        );
        const endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            23,
            59,
            59
        );
        let existingAttendance = await Attendance.findOne({
            EmployeeID,
            Date: { $gte: startDate, $lte: endDate }
        });
        if (!existingAttendance) {
            const attendance = new Attendance({
                EmployeeID,
                Date: Time
            });
            const savedAttendance = await attendance.save();
            existingAttendance = savedAttendance;
        }

        const schedule = new Schedule({
            EmployeeID,
            AttendanceID: existingAttendance._id,
            FromToHours,
            Date: Time
        });

        existingAttendance.ScheduleID = schedule._id;
        await existingAttendance.save();
        const savedSchedule = await schedule.save();

        res.status(201).json({ savedSchedule, existingAttendance });
    } catch (error) {
        next(error);
    }
};
