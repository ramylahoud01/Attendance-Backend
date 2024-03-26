import PunchOut from "../model/PunchOut.js";

export const registerPunchOut = async (req, res, next) => {
    try {
        const { AttendanceId, EndDate } = req.body;
        const newPunchOutRecord = new PunchOut({
            AttendanceId,
            EndDate
        });

        const savedPunchOut = await newPunchOutRecord.save();

        res.status(201).json(savedPunchOut);
    } catch (error) {
        next(error)
    }
};
