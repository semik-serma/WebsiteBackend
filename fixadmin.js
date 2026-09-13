import { connectdb } from './src/config/db.js';
import User from './src/models/userModels.js';

async function fix() {
    await connectdb();
    // Delete the duplicate with capital S (USER role)
    const dup = await User.findOneAndDelete({ email: 'Semikserma@gmail.com' });
    if (dup) console.log('Deleted duplicate:', dup.email, dup.role);
    else console.log('No duplicate with capital S found');

    // Make sure semikserma@gmail.com is ADMIN
    const target = await User.findOneAndUpdate(
        { email: 'semikserma@gmail.com' },
        { $set: { role: 'ADMIN' } },
        { new: true }
    );
    if (target) console.log('Admin user confirmed:', target.email, target.role);
    else console.log('semikserma@gmail.com not found');

    process.exit(0);
}

fix();
