import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import Schedule from "../model/Schedule.js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import moment from 'moment-timezone'

const TimeZone = process.env.TZ
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
            return res.status(404).json({ message: "Employee not found" });
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
        console.log('existingEmployee._id', existingEmployee._id)
        console.log(scheduleFound)
        if (!scheduleFound) {
            return res.status(404).json({ message: "Schedule not found for today" });
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
                console.log('late')
                punchStatus = 'late';
            } else {
                console.log('onTime')
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
            return res.status(201).json({ message: "Already Punched in." });
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
