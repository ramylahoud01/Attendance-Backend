import BreakOut from "../model/BreakOut.js";

export const registerBreakOut = async (req, res, next) => {
    try {
        const { AttendanceId, EndDate } = req.body;
        const newBreakOutRecord = new BreakOut({
            AttendanceId,
            EndDate
        });

        const savedBreakOut = await newBreakOutRecord.save();

        res.status(201).json(savedBreakOut);
    } catch (error) {
        next(error)
    }
};
