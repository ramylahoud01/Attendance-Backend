import Employee from "../model/Employee.js";
import qr from "qr-image";
import QrCode from "../model/QrCode.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { validationResult } from "express-validator";
dotenv.config({ path: '.env.local' });

export const newEmployee = async (req, res, next) => {
    try {
        const { FirstName, LastName, Email, JobTitle, Role, SalaryHourly, HoursPerWeek, Password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error) => error.msg);
            const error = new Error(`${errorMessages}`);
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
            Password: passHashed
        });

        const savedEmployee = await newEmployee.save();
        const qrData = `EmployeeID: ${savedEmployee._id}`;
        const qrBuffer = qr.imageSync(qrData, { type: 'png' });
        const qrBase64 = qrBuffer.toString('base64');
        const qrCode = new QrCode({
            Content: qrBase64,
        });
        const savedQRCode = await qrCode.save();
        savedEmployee.QRCodeID = savedQRCode._id;
        await savedEmployee.save();
        res.status(201).json({ savedEmployee });
    } catch (error) {
        next(error);
    }
};

export const signInEmployee = async (req, res, next) => {
    try {
        const { Email, Password } = req.body;
        const foundEmployee = await Employee.findOne({ Email: Email });
        console.log('hy')
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

export const testroute = (req, res, next) => {
    res.status(200).json({ message: 'This is a test route.' });
}