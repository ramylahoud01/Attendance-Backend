import BreakIn from "../model/BreakIn.js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Employee from "../model/Employee.js";
import Schedule from "../model/Schedule.js";
import PunchIn from "../model/PunchIn.js";

export const registerBreakIn = async (req, res, next) => {
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
            const error = new Error("Employee not found with this QR code.");
            error.statusCode = 404;
            throw error;
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
            const error = new Error("Error: Schedule not found for today. Please contact your manager.");
            error.statusCode = 404;
            throw error;
        }
        if (!scheduleFound.PunchInID) {
            const error = new Error("Error: You Should Punch In First. ");
            error.statusCode = 404;
            throw error;
        }
        if (!scheduleFound.BreakInID) {
            const breakIn = new BreakIn({ StartDate: new Date() });
            const savedBreakIn = await breakIn.save();
            await Schedule.findByIdAndUpdate(
                scheduleFound._id,
                { $set: { BreakInID: savedBreakIn._id } },
                { new: true }
            );
            savedBreakIn.ScheduleID = scheduleFound._id;
            await savedBreakIn.save();
        } else {
            const error = new Error("Error: Break-In Already Completed");
            error.statusCode = 404;
            throw error;
        }
        res.status(201).json({ message: "Break in successful." });
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
