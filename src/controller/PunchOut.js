import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import PunchOut from "../model/PunchOut.js";
import Schedule from "../model/Schedule.js";
import moment from 'moment-timezone'
import dotenv from 'dotenv';
import faceapi from 'face-api.js';
import canvas from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import Face from "../model/Face.js";
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
export const registerPunchOut = async (req, res, next) => {
    try {
        const { Content, image } = req.body;
        let existingEmployee;
        if (Content) {
            // QR Code logic
            const qrCodeData = decodeQRCode(Content);
            const employeeID = parseQRCodeData(qrCodeData);
            if (!employeeID) {
                return res.status(400).json({ message: "Content is invalid or missing" });
            }
            existingEmployee = await Employee.findById(employeeID);
            if (!existingEmployee) {
                return res.status(404).json({ message: "Employee not found with this QR code." });
            }
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

            existingEmployee = await Employee.findOne({ Email: bestMatch.label });
            console.log('Found employee:', existingEmployee);
        } else {
            return res.status(400).json({ message: "Content or image is required" });
        }

        let punchStatus;
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

        res.status(201).json({ message: "Punch out successful." });
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
