import express from "express"
import { displayFullNameAndSchedule, displayEmployees, newEmployee, signInEmployee } from "../controller/Employee.js";
import { EmployeeValidationRulesForNewEmployee, EmployeeValidationRulesForSignIn } from "../Validation/Employee.js";
const route = express.Router()

route.post('/new', EmployeeValidationRulesForNewEmployee, newEmployee);
route.post('/sign', EmployeeValidationRulesForSignIn, signInEmployee)
route.get('/display/:RowsPerPage', displayEmployees)
route.get('/displayFullNameAndSchedule', displayFullNameAndSchedule)

export default route