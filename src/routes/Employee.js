import express from "express";
import {
    displayFullNameAndSchedule,
    displayEmployees,
    newEmployee,
    signInEmployee,
    displayEmployeeForAutoComplete,
    recognizeFace,
    importEmployees
} from "../controller/Employee.js";
import {
    EmployeeValidationRulesForNewEmployee,
    EmployeeValidationRulesForSignIn
} from "../Validation/Employee.js";
import multer from "multer";

const route = express.Router();

const storage = multer.memoryStorage(); // Using memoryStorage instead of diskStorage
const upload = multer({ storage: storage });

route.post('/new', upload.single('file'), EmployeeValidationRulesForNewEmployee, newEmployee);
route.post('/recognize-face', recognizeFace);
route.post('/sign', EmployeeValidationRulesForSignIn, signInEmployee);
route.get('/display/:RowsPerPage', displayEmployees);
route.get('/displayFullNameAndSchedule', displayFullNameAndSchedule);
route.get('/auto-complete', displayEmployeeForAutoComplete);
route.post('/import-csv', upload.single('file'), importEmployees);

export default route;
