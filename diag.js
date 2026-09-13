import { connectdb } from './src/config/db.js';
import User from './src/models/userModels.js';
import bcrypt from 'bcrypt';

async function diag() {
    await connectdb();
    const users = await User.find({}).select('email role firstname lastname');
    console.log('All users:');
    users.forEach(u => console.log(`  ${u.email} | role: ${u.role} | name: ${u.firstname} ${u.lastname}`));

    const target = await User.findOne({ email: 'semikserma@gmail.com' });
    if (!target) {
        console.log('\nsemikserma@gmail.com NOT FOUND in DB');
        process.exit(1);
    }
    console.log(`\nsemikserma@gmail.com: role=${target.role}, password hash length=${target.password.length}`);
    const match = await bcrypt.compare('Phidim@123', target.password);
    console.log(`bcrypt.compare('Phidim@123', hash) = ${match}`);
    process.exit(0);
}

diag();
