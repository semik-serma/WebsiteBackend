import { connectdb } from './src/config/db.js';
import User from './src/models/userModels.js';
import bcrypt from 'bcrypt';

async function test() {
    await connectdb();
    const user = await User.findOne({ email: 'semikserma@gmail.com' });
    if (!user) { console.log('User not found'); process.exit(1); }
    console.log('Stored hash:', user.password);
    const match = await bcrypt.compare('Phidim@123', user.password);
    console.log('Password match:', match);
    const match2 = await bcrypt.compare('Phidim@123'.trim(), user.password);
    console.log('Password match (trimmed):', match2);
    process.exit(0);
}

test();
