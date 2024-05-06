import BreakOut from "../model/BreakOut.js";
import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import Schedule from "../model/Schedule.js";

export const registerBreakOut = async (req, res, next) => {
    try {
        const { Content } = req.body;
        if (!Content) {
            return res.status(400).json({ message: "Content is required" });
        }
        const qrCodeData = decodeQRCode(Content);
        const parsedData = parseQRCodeData(qrCodeData);
        const employeeID = parsedData;

        const existingEmployee = await Employee.findById(employeeID);
        if (!existingEmployee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const currentDate = new Date();
        const result = await PunchIn.aggregate([
            {
                $lookup: {
                    from: "schedules",
                    localField: "ScheduleID",
                    foreignField: "_id",
                    as: "schedule"
                }
            },
            {
                $match: {
                    "schedule.EmployeeID": existingEmployee._id
                }
            },
            {
                $addFields: {
                    timeDifference: { $abs: { $subtract: ["$StartingDate", currentDate] } }
                }
            },
            {
                $sort: { timeDifference: 1 }
            },
            {
                $limit: 1
            },
            {
                $project: {
                    schedule: 0
                }
            }
        ]);
        const closestPunchIn = result[0];
        let scheduleFound = await Schedule.findById(closestPunchIn.ScheduleID)
        if (!scheduleFound) {
            return res.status(404).json({ message: "Schedule not found for today" });
        }
        if (!scheduleFound.PunchInID) {
            return res.status(404).json({ message: "You Should Punch In First ." });
        }
        if (!scheduleFound.BreakOutID) {
            const breakOut = new BreakOut({ EndDate: new Date() });
            const savedBreakOut = await breakOut.save();

            await Schedule.findByIdAndUpdate(
                scheduleFound._id,
                { $set: { BreakOutID: savedBreakOut._id } },
                { new: true }
            );

            savedBreakOut.ScheduleID = scheduleFound._id;
            await savedBreakOut.save();
        } else {
            return res.status(201).json({ message: "Already Break out." });
        }
        res.status(201).json({ message: "Break out successful." });
    } catch (error) {
        next(error)
    }
};

const decodeQRCode = (qrCodeContent) => {
    return qrCodeContent;
};

const parseQRCodeData = (qrCodeData) => {
    try {
        const parsedData = qrCodeData.split(': ');
        if (parsedData.length !== 2) {
            throw new Error('Invalid QR code data format');
        }
        return parsedData[1];
    } catch (error) {
        console.error('Error parsing QR code data:', error.message);
        return null;
    }
};
