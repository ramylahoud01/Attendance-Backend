import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import Schedule from "../model/Schedule.js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import moment from 'moment-timezone'

const TimeZone = process.env.tz
export const registerPunchIn = async (req, res, next) => {
    try {
        const { Content } = req.body;
        let punchStatus;
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
        let scheduleFound = await Schedule.findOne({
            EmployeeID: existingEmployee._id,
            $expr: {
                $and: [
                    { $eq: [{ $year: "$FromDate" }, { $year: currentDate }] },
                    { $eq: [{ $month: "$FromDate" }, { $month: currentDate }] },
                    { $eq: [{ $dayOfMonth: "$FromDate" }, { $dayOfMonth: currentDate }] }
                ]
            }
        });
        if (!scheduleFound) {
            const error = new Error("Error: Schedule not found for today. Please contact your manager.");
            error.statusCode = 404;
            throw error;
        }
        const foundDate = moment(scheduleFound.FromDate);
        const FromDateHour = foundDate.utc().hour();
        const FromDateMinute = foundDate.utc().minute();
        const currentHour = moment().tz(TimeZone).hour();
        const currentMinute = moment().tz(TimeZone).minute();
        if (!scheduleFound.PunchInID) {
            const punchIn = new PunchIn({ StartingDate: new Date() });
            const savedPunchIn = await punchIn.save();
            if (currentHour > FromDateHour || (currentHour === FromDateHour && currentMinute > FromDateMinute)) {
                punchStatus = 'late';
            } else {
                punchStatus = 'onTime';
            }
            await Schedule.findByIdAndUpdate(
                scheduleFound._id,
                { $set: { PunchInID: savedPunchIn._id, PunchStatus: punchStatus } },
                { new: true }
            );

            savedPunchIn.ScheduleID = scheduleFound._id;
            await savedPunchIn.save();
        } else {
            const error = new Error("Error: Punch-In Already Completed");
            error.statusCode = 404;
            throw error;
        }

        res.status(201).json({ message: "Punch in successful." });
    } catch (error) {
        next(error);
    }
};

function getCurrentLocalDateTime() {
    return moment().tz('Asia/Beirut');
}
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
