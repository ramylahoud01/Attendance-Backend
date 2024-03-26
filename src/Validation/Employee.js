import { body } from "express-validator";
import Employee from "../model/Employee.js";

const validateFirstName =
    body('FirstName').not().isEmpty().withMessage('FirstName cannot be empty').bail();

const validateLastName =
    body('LastName').not().isEmpty().withMessage('LastName cannot be empty').bail();

const validateEmail = body("Email")
    .not()
    .isEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("You must enter a valid email")
    .bail()
    .custom((value, { req }) => {
        return Employee.findOne({ Email: value }) // Use "Email" instead of "email"
            .then((userDoc) => {
                if (userDoc) {
                    const error = new Error("Email already exists");
                    error.statusCode = 422;
                    throw error;
                }
                return true;
            });
    })
    .normalizeEmail();

const validatePassword = body("Password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password cannot be empty")
    .bail()
    .isLength({ min: 5 })
    .withMessage("Password should be at least 5 characters long")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/)
    .withMessage("Password should contain one lowercase letter one uppercase letter  and one number");

const validateRole =
    body('Role').not().isEmpty().withMessage('Role cannot be empty').bail();


export const EmployeeValidationRules = [
    validateFirstName,
    validateLastName,
    validateEmail,
    validatePassword,
    validateRole
];
