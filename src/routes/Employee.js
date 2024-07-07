import express from "express"
import { displayFullNameAndSchedule, displayEmployees, newEmployee, signInEmployee, displayEmployeeForAutoComplete, recognizeFace, importEmployees } from "../controller/Employee.js";
import { EmployeeValidationRulesForNewEmployee, EmployeeValidationRulesForSignIn } from "../Validation/Employee.js";
const route = express.Router()
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now().toString()); // Removing the file extension
    }
});
const upload = multer({ storage: storage });

route.post('/new', upload.single('file'), EmployeeValidationRulesForNewEmployee, newEmployee);
route.post('/recognize-face', recognizeFace)
route.post('/sign', EmployeeValidationRulesForSignIn, signInEmployee)
route.get('/display/:RowsPerPage', displayEmployees)
route.get('/displayFullNameAndSchedule', displayFullNameAndSchedule)
route.get('/auto-complete', displayEmployeeForAutoComplete)
route.post('/import-csv', upload.single('file'), importEmployees);

export default route