// Import necessary modules
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './db.js';
import Employee from '../model/Employee.js';

async function createAdminUser() {
    try {
        await connectDB()

        // Hash admin password
        const hashedPassword = await bcrypt.hash('w2w0w0w0', 12); // Hash the desired password

        // Create admin user
        const newAdmin = new Employee({
            Email: 'lahoud284@gmail.com',
            Password: hashedPassword,
            FirstName: "Ramy",
            LastName: "Lahoud",
            JobTitle: "Junior Full Stack Developper",
            Role: "Admin",
            SalaryHourly: 2,
            HoursPerWeek: 35
        });
        const savedAdmin = await newAdmin.save();
        console.log('Admin user created:', savedAdmin);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

createAdminUser();
