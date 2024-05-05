import Schedule from "../model/Schedule.js";

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

export const displayAllSchedule = async (req, res, next) => {
    try {
        const foundSchedules = await Schedule.find({
            $or: [
                { PunchInID: { $exists: true }, PunchOutID: { $exists: true } },
                { PunchStatus: 'OFF' }
            ]
        }).populate([
            {
                path: 'EmployeeID',
                select: 'FirstName LastName'
            },
            {
                path: 'PunchInID'
            }
        ]);
        res.status(200).json({ foundSchedules });
    } catch (error) {
        next(error);
    }
};
