import { connectdb } from './src/config/db.js';
import User from './src/models/userModels.js';
import { hashthepassword } from './src/utils/bcrypt.js';

async function makeAdmin() {
    await connectdb();
    const email = 'semikserma@gmail.com';
    const user = await User.findOne({ email });
    if (user) {
        user.role = 'ADMIN';
        user.password = await hashthepassword('Phidim@123');
        await user.save();
        console.log('Updated', email, 'to ADMIN with password Phidim@123');
    } else {
        const hash = await hashthepassword('Phidim@123');
        await User.create({ firstname: 'Semik', lastname: 'Serma', email, password: hash, role: 'ADMIN' });
        console.log('Created admin user:', email);
    }
    process.exit(0);
}

makeAdmin();
