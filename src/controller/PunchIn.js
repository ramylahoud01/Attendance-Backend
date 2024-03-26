import Attendance from "../model/Attendance.js";
import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";

export const registerPunchIn = async (req, res, next) => {
    try {
        const { Content } = req.body;
        const qrCodeData = decodeQRCode(Content);
        const parsedData = parseQRCodeData(qrCodeData);
        const EmployeeID = parsedData;
        const existingEmployee = await Employee.findById(EmployeeID);
        if (!existingEmployee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const currentDate = new Date();
        const startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            0,
            0,
            0
        );
        const endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            23,
            59,
            59
        );

        let attendance = await Attendance.findOne({
            EmployeeID: existingEmployee._id,
            Date: { $gte: startDate, $lte: endDate }
        });

        if (!attendance) {
            attendance = new Attendance({
                EmployeeID: existingEmployee._id,
                Date: currentDate
            });
            attendance = await attendance.save();
        }

        const punchIn = new PunchIn({ StartingDate: new Date() });
        const savedPunchIn = await punchIn.save();


        await Attendance.findByIdAndUpdate(
            attendance._id,
            { $set: { PunchInID: savedPunchIn._id } },
            { new: true }
        );

        savedPunchIn.AttendanceID = attendance._id;
        await savedPunchIn.save();

        res.status(201).json({ message: "Punch in with success." });
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

export const fetchPunchIns = async (req, res, next) => {
    try {
        const PunchIns = await PunchIn.find().populate({
            path: 'AttendanceID',
            populate: {
                path: 'EmployeeID',
            }
        });
        console.log('PunchIns', PunchIns);
        res.status(200).json({ PunchIns });
    } catch (error) {
        console.error('Error fetching PunchIns:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
