import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import Schedule from "../model/Schedule.js";
import dotenv from 'dotenv';
import faceapi from 'face-api.js';
import canvas from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import Face from "../model/Face.js";
import moment from 'moment-timezone'

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadModels = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, '../model'));
    await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, '../model'));
    await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, '../model'));
};

// Load models initially
loadModels();

dotenv.config({ path: '.env.local' });
const TimeZone = process.env.tz
export const registerPunchIn = async (req, res, next) => {
    try {
        const { Content, image } = req.body;
        if (Content) {
            // QR Code logic
            let punchStatus;
            const qrCodeData = decodeQRCode(Content);
            const employeeID = parseQRCodeData(qrCodeData);

            if (!employeeID) {
                return res.status(400).json({ message: "Content is invalid or missing" });
            }

            const existingEmployee = await Employee.findById(employeeID);
            if (!existingEmployee) {
                return res.status(404).json({ message: "Employee not found with this QR code." });
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
                return res.status(404).json({ message: "Schedule not found for today. Please contact your manager." });
            }

            const fromDate = moment(scheduleFound.FromDate).utc();
            const currentDateTime = moment().tz(TimeZone).utc();
            const isLate = currentDateTime.isAfter(fromDate);

            if (!scheduleFound.PunchInID) {
                const punchIn = new PunchIn({ StartingDate: new Date() });
                const savedPunchIn = await punchIn.save();

                punchStatus = isLate ? 'late' : 'onTime';

                await Schedule.findByIdAndUpdate(
                    scheduleFound._id,
                    { $set: { PunchInID: savedPunchIn._id, PunchStatus: punchStatus } },
                    { new: true }
                );

                savedPunchIn.ScheduleID = scheduleFound._id;
                await savedPunchIn.save();
            } else {
                return res.status(400).json({ message: "Punch-In already completed" });
            }

            return res.status(201).json({ message: "Punch in successful." });
        } else if (image) {
            // Face recognition logic
            console.log('Incoming image data:', image.substring(0, 30));
            if (!image.startsWith('data:image/jpeg;base64,')) {
                return res.status(400).json({ error: 'Invalid image format. Only JPEG images are supported.' });
            }
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const imageCanvas = await canvas.loadImage(buffer);
            const detection = await faceapi.detectSingleFace(imageCanvas).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                console.log('No face detected');
                return res.status(404).json({ error: 'No face detected' });
            }

            const detectedDescriptor = detection.descriptor;

            const storedFaces = await Face.find().populate('EmployeeID');

            const labeledDescriptors = storedFaces.map(face => {
                const descriptorArray = face.descriptor.map(item => parseFloat(item));
                const floatDescriptor = new Float32Array(descriptorArray);
                return new faceapi.LabeledFaceDescriptors(face.EmployeeID.Email, [floatDescriptor]);
            });

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            console.log('FaceMatcher:', faceMatcher);

            const bestMatch = faceMatcher.findBestMatch(detectedDescriptor);
            console.log('Best match:', bestMatch);

            if (bestMatch.label === 'unknown') {
                return res.status(404).json({ error: 'No matching employee found' });
            }

            const foundEmployee = await Employee.findOne({ Email: bestMatch.label });
            console.log('Found employee:', foundEmployee);

            // Continue with your PunchIn logic for face recognition
            let punchStatus;

            const currentDate = new Date();
            let scheduleFound = await Schedule.findOne({
                EmployeeID: foundEmployee._id,
                $expr: {
                    $and: [
                        { $eq: [{ $year: "$FromDate" }, { $year: currentDate }] },
                        { $eq: [{ $month: "$FromDate" }, { $month: currentDate }] },
                        { $eq: [{ $dayOfMonth: "$FromDate" }, { $dayOfMonth: currentDate }] }
                    ]
                }
            });
            console.log('scheduleFound', scheduleFound)
            if (!scheduleFound) {
                return res.status(404).json({ message: "Schedule not found for today. Please contact your manager." });
            }

            const fromDate = moment(scheduleFound.FromDate).utc();
            const currentDateTime = moment().tz(TimeZone).utc();
            const isLate = currentDateTime.isAfter(fromDate);

            if (!scheduleFound.PunchInID) {
                const punchIn = new PunchIn({ StartingDate: new Date() });
                const savedPunchIn = await punchIn.save();

                punchStatus = isLate ? 'late' : 'onTime';

                await Schedule.findByIdAndUpdate(
                    scheduleFound._id,
                    { $set: { PunchInID: savedPunchIn._id, PunchStatus: punchStatus } },
                    { new: true }
                );

                savedPunchIn.ScheduleID = scheduleFound._id;
                await savedPunchIn.save();
            } else {
                return res.status(400).json({ message: "Punch-In already completed" });
            }

            return res.status(201).json({ message: "Punch in successful." });
        } else {
            return res.status(400).json({ message: "Content or image is required" });
        }
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
