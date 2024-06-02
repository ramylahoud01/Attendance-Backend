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
            const error = new Error("Error: You Should Break In First. ");
            error.statusCode = 404;
            throw error;
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
            const error = new Error("Error: Break-Out Already Completed");
            error.statusCode = 404;
            throw error;
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
