import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import PunchOut from "../model/PunchOut.js";
import Schedule from "../model/Schedule.js";
import moment from 'moment-timezone'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TimeZone = process.env.tz
export const registerPunchOut = async (req, res, next) => {
    try {
        const { Content } = req.body;
        const qrCodeData = decodeQRCode(Content);
        const parsedData = parseQRCodeData(qrCodeData);
        const EmployeeID = parsedData;
        const existingEmployee = await Employee.findById(EmployeeID);
        let punchStatus;
        if (!existingEmployee) {
            const error = new Error("Employee not found with this QR code.");
            error.statusCode = 404;
            throw error;
        }
        let currentDate = new Date();

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
        if (!scheduleFound.PunchOutID) {
            console.log('currentDate', new Date())
            const punchOut = new PunchOut({ EndDate: new Date(), ScheduleID: closestPunchIn.ScheduleID });
            const ToDate = moment(scheduleFound.ToDate); // Convert ToDate to a moment object
            const ToDateDay = ToDate.utc().date();
            const ToDateHour = ToDate.utc().hour();
            const currentDay = moment().tz(TimeZone).date();
            const currentHour = moment().tz(TimeZone).hour();

            if (ToDateDay === currentDay) {
                if (currentHour < ToDateHour) {
                    punchStatus = scheduleFound.PunchStatus === 'onTime' ? 'LeavingEarly' : 'lateAndLeavingEarly'
                } else {
                    punchStatus = scheduleFound.PunchStatus === 'onTime' ? 'onTime' : 'late'
                }
            } else if (ToDateDay > currentDay) {
                punchStatus = scheduleFound.PunchStatus === 'onTime' ? 'LeavingEarly' : 'lateAndLeavingEarly'
            } else {
                punchStatus = scheduleFound.PunchStatus === 'onTime' ? 'onTime' : 'late'
            }
            const savedPunchOut = await punchOut.save();
            await Schedule.findByIdAndUpdate(
                scheduleFound._id,
                { $set: { PunchOutID: savedPunchOut._id, PunchStatus: punchStatus } },
                { new: true }
            );
        } else {
            const error = new Error("Error: Punch-Out Already Completed");
            error.statusCode = 404;
            throw error;
        }
        res.status(201).json({ message: "Punch out with success." });
    } catch (error) {
        next(error);
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
