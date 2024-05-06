import Employee from "../model/Employee.js";
import PunchIn from "../model/PunchIn.js";
import Schedule from "../model/Schedule.js";
import moment from 'moment-timezone'
export const newSchedule = async (req, res, next) => {
    try {
        const { FromDate, ToDate } = req.body;
        const { EmployeeID } = req.params;

        const schedule = new Schedule({
            EmployeeID,
            FromDate: FromDate,
            ToDate: ToDate
        });
        const savedSchedule = await schedule.save();

        const event = {
            EmployeeID,
            FromDate: FromDate,
            ToDate: ToDate,
            allDay: false
        };

        res.status(201).json({ savedSchedule, event });
    } catch (error) {
        next(error);
    }
};

export const generateManyScheduleFromTable = async (req, res, next) => {
    try {
        const { multiCheckBoxSelected, period } = req.body;
        const schedulesByEmployee = [];

        for (const schedule of multiCheckBoxSelected) {
            const selectedDate = parseDate(schedule.date);
            const { startDate, endDate } = parsePeriod(selectedDate, period);
            const punchStatus = endDate ? 'onTime' : 'OFF';
            const newSchedule = new Schedule({
                FromDate: startDate,
                ToDate: endDate,
                EmployeeID: schedule.EmployeeID,
                PunchStatus: punchStatus
            });
            await newSchedule.save()
            schedulesByEmployee.push({
                employeeID: schedule.EmployeeID,
                period,
                date: startDate.toLocaleDateString()
            });
        }
        res.status(200).json(schedulesByEmployee);
    } catch (error) {
        next(error);
    }
}



export const generateScheduleFromTable = async (req, res, next) => {
    try {
        const { EmployeeID } = req.params;
        const { date, period } = req.body;
        const selectedDate = parseDate(date);
        console.log('date', date)
        console.log('period', period)
        const { startDate, endDate } = parsePeriod(selectedDate, period);
        let schedule = await Schedule.findOne({
            EmployeeID: EmployeeID,
            $expr: {
                $and: [
                    { $eq: [{ $year: "$FromDate" }, { $year: startDate }] },
                    { $eq: [{ $month: "$FromDate" }, { $month: startDate }] },
                    { $eq: [{ $dayOfMonth: "$FromDate" }, { $dayOfMonth: startDate }] }
                ]
            }
        });
        if (!schedule) {
            schedule = new Schedule({
                FromDate: startDate,
                ToDate: endDate,
                EmployeeID: EmployeeID,
                PunchStatus: endDate ? 'onTime' : 'OFF'
            });
        } else {
            schedule.FromDate = startDate;
            schedule.ToDate = endDate;
            schedule.PunchStatus = endDate ? 'onTime' : 'OFF';
        }
        await schedule.save();
        res.status(200).json({ period, date: (new Date(date)).toLocaleDateString(), id: EmployeeID });
    } catch (error) {
        next(error);
    }
};

function parseDate(dateString) {
    const selectedDate = new Date(dateString);
    selectedDate.setUTCHours(0, 0, 0, 0);
    return selectedDate;
}

function parsePeriod(selectedDate, period) {
    if (period.trim() !== 'OFF') {
        const [start, end] = period.split(' - ');
        const [startHour, startMeridiem] = start.split(/(?=[AP]M)/).map(str => str.trim());
        const [endHour, endMeridiem] = end.split(/(?=[AP]M)/).map(str => str.trim());
        let startDate = new Date(selectedDate);
        startDate.setUTCHours(getHour(startHour, startMeridiem));
        let endDate = new Date(selectedDate);
        if ((startMeridiem === 'PM' && endMeridiem === 'AM')) {
            endDate.setDate(endDate.getDate() + 1);
        }
        endDate.setUTCHours(getHour(endHour, endMeridiem));
        return { startDate, endDate };
    } else {
        let startDate = new Date(selectedDate);
        return { startDate: startDate, endDate: null };
    }
}

function getHour(hour, meridiem) {
    let hourValue = parseInt(hour);
    if (meridiem === 'PM' && hourValue < 12) {
        hourValue += 12;
    } else if (meridiem === 'AM' && hourValue === 12) {
        hourValue = 0; // 12 AM is equivalent to 0 hours
    }
    return hourValue;
}


export const displaySchedulebyId = async (req, res, next) => {
    try {
        const { EmployeeID } = req.params;
        const foundSchedules = await Schedule.find({ EmployeeID })
        res.status(200).json({ foundSchedules })
    }
    catch (error) {
        next(error)
    }
}

// export const displayAllSchedule = async (req, res, next) => {
//     try {
//         const { query } = req.query;
//         const regex = new RegExp(query, 'i');

//         const matchingEmployees = await Employee.find({ FirstName: regex });
//         const employeeIDs = matchingEmployees.map(employee => employee._id);
//         const foundSchedules = await Schedule.find({
//             $or: [
//                 { PunchInID: { $exists: true }, PunchOutID: { $exists: true } },
//                 { PunchStatus: 'OFF' }
//             ],
//             EmployeeID: { $in: employeeIDs }
//         }).populate([
//             {
//                 path: 'EmployeeID',
//                 select: 'FirstName LastName'
//             },
//             {
//                 path: 'PunchInID'
//             }
//         ]);
//         console.log('foundSchedules', foundSchedules)
//         res.status(200).json({ foundSchedules });
//     } catch (error) {
//         next(error);
//     }
// };

export const displayAllSchedule = async (req, res, next) => {
    try {
        const { query } = req.query;
        const regex = new RegExp(query, 'i');

        // Splitting first name and last name
        const [firstName, lastName] = query.split(' ');

        const foundSchedules = await Schedule.aggregate([
            {
                $match: {
                    $or: [
                        { PunchInID: { $exists: true }, PunchOutID: { $exists: true } },
                        { PunchStatus: 'OFF' }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'EmployeeID',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $match: {
                    $or: [
                        { 'employee.FirstName': { $regex: regex } },
                        { 'employee.LastName': { $regex: regex } },
                        { 'employee.FirstName': { $regex: new RegExp(firstName, 'i') }, 'employee.LastName': { $regex: new RegExp(lastName, 'i') } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'punchins',
                    localField: 'PunchInID',
                    foreignField: '_id',
                    as: 'punchIn'
                }
            },
            {
                $lookup: {
                    from: 'punchouts',
                    localField: 'PunchOutID',
                    foreignField: '_id',
                    as: 'punchOut'
                }
            },
            {
                $project: {
                    PunchStatus: 1,
                    FromDate: 1,
                    ToDate: 1,
                    EmployeeID: {
                        _id: '$employee._id',
                        FirstName: '$employee.FirstName',
                        LastName: '$employee.LastName'
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    PunchInID: { $arrayElemAt: ['$punchIn', 0] },
                    PunchOutID: { $arrayElemAt: ['$punchOut', 0] }
                }
            }
        ]);

        res.status(200).json({ foundSchedules });
    } catch (error) {
        next(error);
    }
};




export const generateScheduleForReports = async (req, res, next) => {
    try {
        const { EmployeeID, SelectedDate, Role } = req.body;
        let query = {};
        const queryConditions = [];

        queryConditions.push({
            PunchInID: { $exists: true },
            PunchOutID: { $exists: true }
        });

        if (EmployeeID && EmployeeID !== 'undefined') {
            queryConditions.push({ EmployeeID });
        }

        if (SelectedDate && SelectedDate !== 'undefined' && SelectedDate[0] !== "") {
            const startDate = new Date(SelectedDate[0]);
            const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
            const adjustStartDate = new Date(startDate.getTime() - userTimezoneOffset);

            const dateCondition = { $gte: adjustStartDate };
            if (SelectedDate && SelectedDate[1] !== "" && SelectedDate[1]) {
                const endDate = new Date(SelectedDate[1]);
                const userTimezoneOffset = endDate.getTimezoneOffset() * 60000;
                const adjustEndDate = new Date(endDate.getTime() - userTimezoneOffset);
                dateCondition.$lte = adjustEndDate;
            }
            queryConditions.push({
                FromDate: dateCondition
            });
        }
        if (queryConditions.length > 0) {
            query = { $and: queryConditions };
        }
        let scheduleFound = await Schedule.find(query)
            .populate([
                { path: 'EmployeeID', select: ['FirstName', 'LastName', 'Role'] },
                { path: 'PunchInID' },
                { path: 'PunchOutID' }
            ]);

        scheduleFound.sort((a, b) => {
            const nameA = `${a.EmployeeID.FirstName} ${a.EmployeeID.LastName}`;
            const nameB = `${b.EmployeeID.FirstName} ${b.EmployeeID.LastName}`;
            return nameA.localeCompare(nameB);
        });
        if (Role && Role !== 'undefined' && Role !== "") {
            scheduleFound = scheduleFound.filter(schedule => schedule?.EmployeeID?.Role === Role);
        }
        function addLeadingZero(value) {
            return value < 10 ? `0${value}` : value;
        }
        const adjustedSchedules = scheduleFound.map((schedule) => {
            const AdjustedFromHour = (schedule.FromDate.getUTCHours() % 12) || 12;
            const AdjustedFromPeriod = schedule.FromDate.getUTCHours() >= 12 ? "PM" : "AM";
            const AdjustedToHour = (schedule.ToDate.getUTCHours() % 12) || 12;
            const AdjustedToPeriod = schedule.ToDate.getUTCHours() >= 12 ? "PM" : "AM";
            const AdjustedFrom = `${AdjustedFromHour}${AdjustedFromPeriod}`;
            const AdjustedTo = `${AdjustedToHour}${AdjustedToPeriod}`;
            const AdjustedDate = `${schedule.FromDate.getFullYear()}-${addLeadingZero(schedule.FromDate.getMonth() + 1)}-${addLeadingZero(schedule.FromDate.getDate())}`;
            return {
                EmployeeName: `${schedule?.EmployeeID?.FirstName || ''} ${schedule?.EmployeeID?.LastName || ''}`,
                Shiftwork: ` ${AdjustedFrom} - ${AdjustedTo} `,
                FullDate: AdjustedDate,
                PunchIn: `${schedule.PunchInID.StartingDate.getHours()}:${schedule.PunchInID.StartingDate.getMinutes().toString().padStart(2, '0')}:${schedule.PunchInID.StartingDate.getSeconds().toString().padStart(2, '0')}`,
                PunchOut: `${schedule.PunchOutID.EndDate.getHours()}:${schedule.PunchOutID.EndDate.getMinutes().toString().padStart(2, '0')}:${schedule.PunchOutID.EndDate.getSeconds().toString().padStart(2, '0')}`,
                PunchStatus: schedule.PunchStatus,
            };
        });
        res.status(200).json(adjustedSchedules);
    } catch (error) {
        next(error);
    }
}

