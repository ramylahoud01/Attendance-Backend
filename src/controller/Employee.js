import Employee from "../model/Employee.js";
import qr from "qr-image";
import QrCode from "../model/QrCode.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { validationResult } from "express-validator";
import Schedule from "../model/Schedule.js";
import faceapi from 'face-api.js';
import canvas from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import Face from "../model/Face.js";
import fs from "fs";
import { Readable } from 'stream';
import csv from 'csv-parser';
dotenv.config({ path: '.env.local' });


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


export const newEmployee = async (req, res, next) => {
    try {
        const { FirstName, LastName, Email, JobTitle, Role, SalaryHourly, HoursPerWeek, Password } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error) => error.msg);
            const error = new Error(errorMessages.join(', '));
            error.statusCode = 422;
            throw error;
        }

        const passHashed = await bcrypt.hash(Password, 12);
        const newEmployee = new Employee({
            FirstName,
            LastName,
            Email,
            JobTitle,
            Role,
            SalaryHourly,
            HoursPerWeek,
            Password: passHashed,
        });

        const savedEmployee = await newEmployee.save();

        // Generate QR Code and save it
        const qrData = `EmployeeID: ${savedEmployee._id}`;
        const qrBuffer = qr.imageSync(qrData, { type: 'png' });
        const qrBase64 = qrBuffer.toString('base64');
        const qrCode = new QrCode({ Content: qrBase64 });
        const savedQRCode = await qrCode.save();
        savedEmployee.QRCodeID = savedQRCode._id;

        // Process image and save face descriptor if available
        if (req.file && req.file.buffer) {
            const imgBuffer = req.file.buffer;
            const img = await canvas.loadImage(imgBuffer);

            // Start face detection asynchronously
            processImageAndSaveFaceDescriptor(img, savedEmployee._id)
                .then(() => {
                    // Handle success
                })
                .catch((error) => {
                    // Handle error
                    console.error('Error processing image:', error);
                });
        }

        await savedEmployee.save();
        res.status(201).json({ savedEmployee });
    } catch (error) {
        next(error);
    }
};

// Function to process image and save face descriptor asynchronously
async function processImageAndSaveFaceDescriptor(img, employeeId) {
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
        const descriptorArray = Array.from(detections.descriptor);

        const newFace = new Face({
            descriptor: descriptorArray,
            EmployeeID: employeeId,
        });

        await newFace.save();
        // Optionally update the employee with FaceID
        // savedEmployee.FaceID = newFace._id;
    } else {
        throw new Error('No face detected in the image');
    }
}





export const recognizeFace = async (req, res, next) => {
    try {
        const { image } = req.body;
        console.log('Incoming image data:', image.substring(0, 30));

        // Process the base64 image
        const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const imageCanvas = await canvas.loadImage(buffer);
        const detection = await faceapi.detectSingleFace(imageCanvas).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            console.log('No face detected');
            return res.status(404).json({ error: 'No face detected' });
        }

        const detectedDescriptor = detection.descriptor;
        console.log('Detected descriptor:', detectedDescriptor);

        const storedFaces = await Face.find().populate('EmployeeID');
        console.log('Stored faces:', storedFaces);

        // Create LabeledFaceDescriptors from storedFaces
        const labeledDescriptors = storedFaces.map(face => {
            const descriptorArray = face.descriptor.map(item => parseFloat(item));
            const floatDescriptor = new Float32Array(descriptorArray);
            return new faceapi.LabeledFaceDescriptors(face.EmployeeID.Email, [floatDescriptor]);
        });

        console.log('Labeled descriptors:', labeledDescriptors);

        // The FaceMatcher class is used to compare face descriptors and find the best matches.
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        console.log('FaceMatcher:', faceMatcher);

        // Find the best match
        const bestMatch = faceMatcher.findBestMatch(detectedDescriptor);
        console.log('Best match:', bestMatch);

        if (bestMatch.label === 'unknown') {
            return res.status(404).json({ error: 'No matching employee found' });
        }

        // Retrieve the matching employee details
        const foundEmployee = await Employee.findOne({ Email: bestMatch.label });
        console.log('Found employee:', foundEmployee);

        res.status(200).json({ foundEmployee });
    } catch (error) {
        console.error('Error recognizing face:', error);
        next(error);
    }
};



export const signInEmployee = async (req, res, next) => {
    try {
        const { Email, Password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error) => error.msg);
            const error = new Error(`${errorMessages}`);
            error.statusCode = 422;
            throw error;
        }
        const foundEmployee = await Employee.findOne({ Email: Email });
        if (!foundEmployee) {
            const error = new Error("Email not found. Please provide a valid email.");
            error.statusCode = 404;
            throw error;
        }
        const comparePassword = await bcrypt.compare(Password, foundEmployee.Password)
        if (!comparePassword) {
            const error = new Error("Invalid password. Please verify your password.");
            error.statusCode = 401;
            throw error;
        }
        const tokenPayload = {
            id: foundEmployee._id.toString(),
            Role: foundEmployee.Role
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);

        res.status(200).json({
            token: token,
            userDetails: {
                id: foundEmployee._id.toString(),
                Email: foundEmployee.Email,
                Role: foundEmployee.Role,
            },
        })
    } catch (error) {
        next(error)
    }
}
export const displayEmployees = async (req, res, next) => {
    try {
        const { query, page } = req.query;
        let { RowsPerPage } = req.params;

        RowsPerPage = parseInt(RowsPerPage) || 20;

        let searchCondition = {};
        let FirstName = '';
        let LastName = '';

        if (query && typeof query === 'string') {
            const FullName = query.split(' ');
            FirstName = FullName[0];
            LastName = FullName[1] || '';
        }

        if (query) {
            searchCondition.$or = [
                {
                    $and: [
                        { FirstName: new RegExp(FirstName, "i") },
                        { LastName: new RegExp(LastName, "i") }
                    ]
                },
                {
                    Role: new RegExp(query, "i")
                },
                {
                    Email: new RegExp(query, "i")
                },
                {
                    JobTitle: new RegExp(query, "i")
                }
            ];
        }

        const skipCount = page ? parseInt(page) * RowsPerPage : 0;

        const employees = await Employee
            .find(searchCondition)
            .skip(skipCount)
            .limit(RowsPerPage)
            .select('FirstName LastName Email JobTitle Role SalaryHourly HoursPerWeek QRCodeID')
            .populate('QRCodeID');
        const countEmployee = await Employee.countDocuments(searchCondition);

        res.status(200).json({ employees, TotalEmployee: countEmployee });
    } catch (error) {
        next(error);
    }
};

export const displayFullNameAndSchedule = async (req, res, next) => {
    try {
        const employees = await Employee.find().select('FirstName LastName');
        const adjustedEmployees = await Promise.all(employees.map(async (employee) => {
            const schedules = await Schedule.find({ EmployeeID: employee._id }).select('FromDate ToDate');
            const adjustedSchedules = schedules.map((schedule) => {
                if (schedule.FromDate && schedule.ToDate) {
                    const fromHourStr = schedule.FromDate.toISOString().substring(11, 13);
                    const toHourStr = schedule.ToDate.toISOString().substring(11, 13);

                    const adjustedToHourNumber = Number(toHourStr) === 12 ? '12PM' : (Number(toHourStr) > 12 ? (Number(toHourStr) - 12 + 'PM') : (Number(toHourStr) + 'AM'));
                    const adjustedFromHourNumber = Number(fromHourStr) === 12 ? '12PM' : (Number(fromHourStr) > 12 ? (Number(fromHourStr) - 12 + 'PM') : (Number(fromHourStr) + 'AM'));
                    return {
                        id: schedule.FromDate.toLocaleDateString('en-LB'),
                        date: `${adjustedFromHourNumber} - ${adjustedToHourNumber}`
                    };
                } else {
                    return {
                        id: schedule.FromDate.toLocaleDateString('en-LB'),
                        date: ' OFF '
                    };
                }
            });

            return {
                FullName: `${employee.FirstName} ${employee.LastName}`,
                id: employee._id,
                schedules: adjustedSchedules
            };
        }));
        res.status(200).json(adjustedEmployees);
    } catch (error) {
        next(error);
    }
};


export const displayEmployeeForAutoComplete = async (req, res, next) => {
    try {
        const { searchQuery } = req.query
        let cnd = {}
        const FullName = searchQuery.split(' ');
        const FirstName = FullName[0];
        const LastName = FullName[1] || '';
        if (searchQuery.length >= 1) {
            cnd.$or = [
                {
                    $and: [
                        { FirstName: new RegExp(FirstName, "i") },
                        { LastName: new RegExp(LastName, "i") }
                    ]
                }]
        } else {
            cnd = { _id: { $eq: null } }
        }

        const employees = await Employee.find(cnd).select('FirstName LastName')
        res.status(200).json({ employees })
    } catch (error) {
        next(error)
    }
}

export const importEmployees = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    try {
        const csvData = req.file.buffer.toString('utf8');
        const readableStream = Readable.from([csvData]);

        readableStream
            .pipe(csv())
            .on('data', async (data) => {
                const { FirstName, LastName, Email, JobTitle, Role, SalaryHourly, HoursPerWeek, Password } = data;

                try {
                    const passHashed = await bcrypt.hash(Password, 12);
                    const newEmployee = new Employee({
                        FirstName,
                        LastName,
                        Email,
                        JobTitle,
                        Role,
                        SalaryHourly,
                        HoursPerWeek,
                        Password: passHashed,
                    });

                    const savedEmployee = await newEmployee.save();

                    // Generate QR Code and save it
                    const qrData = `EmployeeID: ${savedEmployee._id}`;
                    const qrBuffer = qr.imageSync(qrData, { type: 'png' });
                    const qrBase64 = qrBuffer.toString('base64');
                    const qrCode = new QrCode({ Content: qrBase64 });
                    const savedQRCode = await qrCode.save();
                    savedEmployee.QRCodeID = savedQRCode._id;

                    await savedEmployee.save();
                } catch (err) {
                    console.error(`Error creating employee: ${FirstName} ${LastName}`, err);
                }
            })
            .on('end', () => {
                console.log('CSV processing finished');
                res.json({ message: 'CSV file processed successfully' });
            })
            .on('error', (err) => {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'An error occurred during CSV processing', error: err });
                }
                next(err);
            });
    } catch (error) {
        next(error);
    }
};
