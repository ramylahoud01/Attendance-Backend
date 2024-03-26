import Attendance from "../model/Attendance.js";

export const newAttendance = async (req, res, next) => {
    try {
        const { PunchIn, PunchOut, BreakIn, BreakOut, EmployeeId } = req.body;

        const newAttendanceRecord = new Attendance({
            PunchIn,
            PunchOut,
            BreakIn,
            BreakOut,
            EmployeeId
        });

        const savedAttendance = await newAttendanceRecord.save();

        res.status(201).json(savedAttendance);
    } catch (error) {
        next(error)
    }
};
