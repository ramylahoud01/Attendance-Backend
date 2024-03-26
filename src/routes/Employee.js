import express from "express"
import { displayEmployees, newEmployee, signInEmployee } from "../controller/Employee.js";
import { EmployeeValidationRules } from "../Validation/Employee.js";
const route = express.Router()

route.post('/new', EmployeeValidationRules, newEmployee);
route.post('/sign', signInEmployee)
route.get('/display/:RowsPerPage', displayEmployees)


export default route