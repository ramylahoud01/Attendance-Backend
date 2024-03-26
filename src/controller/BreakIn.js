import BreakIn from "../model/BreakIn.js";

export const registerBreakIn = async (req, res, next) => {
    try {
        const { AttendanceId, StartingDate } = req.body;
        const newBreakInRecord = new BreakIn({
            AttendanceId,
            StartingDate
        });

        const savedBreakIn = await newBreakInRecord.save();

        res.status(201).json(savedBreakIn);
    } catch (error) {
        next(error)
    }
};
