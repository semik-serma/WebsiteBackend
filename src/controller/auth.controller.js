import { Admin } from "mongodb";
import { otpmodel } from "../models/otpModel.js";
import User from "../models/userModels.js";
import { hashthepassword } from "../utils/bcrypt.js";
import { otpgenerate } from "../utils/generateOtp.js";
import { tokengenerate } from "../utils/generatetoken.js";
import { sendmail } from "../utils/mailer.js";
import { errorResponse, successResponse } from "../utils/response.js";
import bcrypt from 'bcrypt'
import axios from 'axios'

// export const register = async (req, res) => {
//     try {
//         // Validate req.body exists before destructuring
//         if (!req.body) {
//             return errorResponse(res, 'Request body is required');
//         }

//         const { firstname, lastname, email, password } = req.body;

//         if (!email) return errorResponse(res, 'pls enter your email');
//         if (!password) return errorResponse(res, 'pls enter your password');
//         if (!firstname) return errorResponse(res, 'pls enter your first name');
//         if (!lastname) return errorResponse(res, 'pls enter your last name');

//         const existing = await User.findOne({ email });
//         if (existing) {
//             return errorResponse(res, 'user already registered');
//         }

//         const hash = await hashthepassword(password.trim());
//         await User.create({
//             email,
//             password: hash,
//             firstname,
//             lastname
//         });

//         successResponse(res, 'user created successfully');
//     } catch (error) {
//         errorResponse(res, 'error at register', 500, error.message);
//     }
// };

export const registerSecond = async (req, res) => {
    try {
        console.log(`[REGISTER] body:`, req.body)
        const email = req.body.email?.trim().toLowerCase()
        console.log(`[REGISTER] normalized email: "${email}"`)
        if (!email) {
            return errorResponse(res, 'email required')
        }
        const userfound = await User.findOne({ email: new RegExp('^' + email + '$', 'i') })
        if (userfound) {
            return errorResponse(res, 'user already registered')
        }
        // Delete any existing OTPs for this email (used or unused) to always allow retry
        await otpmodel.deleteMany({ email: email })
        const otp = otpgenerate()
        await otpmodel.create({
            email: email,
            otp: String(otp)
        })
        await sendmail(email, otp)
        // Return OTP in response so it's visible even if email sending fails
        successResponse(res, 'OTP sent! It expires in 5 minutes.', otp)
    } catch (error) {
        console.log(error)
        res.status(400).json({
            message: 'error at register second',
            error: error.message
        })
    }
}

export const verifyuser = async (req, res) => {
    try {
        // Validate req.body exists before destructuring
        if (!req.body) {
            return errorResponse(res, 'Request body is required');
        }

        const { password, otp, firstname, lastname } = req.body
        const email = req.body.email?.trim().toLowerCase()

        if (!email) {
            return errorResponse(res, 'pls enter your email')
        }
        if (!password) {
            return errorResponse(res, 'pls enter your password')
        }
        if (!otp) {
            return errorResponse(res, 'enter your otp')
        }
        const otpString = String(otp).trim().replace(/\s/g, '')

        let findemail = await otpmodel.findOne({ 
            email: email,
            isUsed: false 
        })

        if (!findemail || String(findemail.otp).trim() !== otpString) {
            const reason = !findemail ? 'No OTP found' : 'OTP value mismatch'
            return errorResponse(res, `Invalid or expired OTP code. Please request a new one. (${reason})`)
        }
        const hash = await hashthepassword(password)
        await otpmodel.findByIdAndUpdate(findemail._id, { isUsed: true })
        await User.create({
            email: email,
            password: hash,
            firstname: firstname,
            lastname: lastname
        })
        console.log(`[VERIFY] User created successfully: "${email}"`)
        successResponse(res, 'user created successfully')

    } catch (error) {
        res.status(400).json({
            message: "error at verifyuser",
            error: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        if (!req.body) {
            return errorResponse(res, 'Request body is required');
        }

        const { email, password } = req.body
        console.log(`[LOGIN] raw email: "${email}", password: ${password ? 'provided' : 'missing'}`)
        if (!email) {
            return errorResponse(res, 'pls enter your email')
        }
        if (!password) {
            return errorResponse(res, 'pls enter your password')
        }
        const normalizedEmail = email.trim().toLowerCase()
        console.log(`[LOGIN] searching for: "${normalizedEmail}"`)
        const emailfind = await User.findOne({ email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') })
        console.log(`[LOGIN] found: ${emailfind ? emailfind.email : 'null'}`)
        if (!emailfind) {
            // Check total user count to see if DB has any users at all
            const count = await User.countDocuments()
            console.log(`[LOGIN] total users in DB: ${count}`)
            return errorResponse(res, 'couldnt find your email')
        }
        const passwordhash = await bcrypt.compare(password.trim(), emailfind.password)

        console.log(passwordhash, emailfind.password, password)
        if (!passwordhash) {
            return errorResponse(res, 'password not matched')
        }
        const payload = {
            email: emailfind.email,
            firstname: emailfind.firstname,
            role: emailfind.role,
            lastname: emailfind.lastname,
        }
        const token = tokengenerate(payload)


        successResponse(res, 'logined successfully', { data: payload, token })
    } catch (error) {
        errorResponse(res, 'error at login', 500, error.message)
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token')
        successResponse(res, 'logged out successfully')
    } catch (error) {
        errorResponse(res, 'error at logout', 500, error.message)
    }
}

/**
 * Generate Google OAuth 2.0 Consent URL
 */
export const getGoogleAuthUrl = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return errorResponse(res, 'GOOGLE_CLIENT_ID is not configured in backend .env', 500);
        }

        const redirectUri = req.query.redirect_uri || 'http://localhost:3000/auth/google/callback';
        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'select_account'
        });

        const url = `${rootUrl}?${params.toString()}`;
        return successResponse(res, 'Google Auth URL generated', { url });
    } catch (error) {
        return errorResponse(res, 'Failed to generate Google Auth URL', 500, error.message);
    }
};

/**
 * Handle Google OAuth Callback / Code Exchange
 */
export const googleAuthCallback = async (req, res) => {
    try {
        const { code, redirectUri } = req.body;
        if (!code) {
            return errorResponse(res, 'Authorization code is required', 400);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return errorResponse(res, 'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in backend .env', 500);
        }

        const callbackRedirectUri = redirectUri || 'http://localhost:3000/auth/google/callback';

        // 1. Exchange authorization code for tokens
        let tokenResponse;
        try {
            tokenResponse = await axios.post(
                'https://oauth2.googleapis.com/token',
                new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: callbackRedirectUri,
                    grant_type: 'authorization_code'
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
        } catch (tokenErr) {
            console.error('Google token exchange failed:', tokenErr.response?.data || tokenErr.message);
            const detail = tokenErr.response?.data?.error_description || tokenErr.response?.data?.error || tokenErr.message;
            return errorResponse(res, `Google authorization failed: ${detail}`, 400);
        }

        const { access_token } = tokenResponse.data;
        if (!access_token) {
            return errorResponse(res, 'Failed to retrieve access token from Google', 400);
        }

        // 2. Fetch user profile from Google
        let userInfoResponse;
        try {
            userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
        } catch (userErr) {
            console.error('Google userinfo fetch failed:', userErr.response?.data || userErr.message);
            return errorResponse(res, 'Failed to fetch user information from Google', 400);
        }

        const { sub: googleId, email, given_name, family_name, name, picture } = userInfoResponse.data;

        if (!email) {
            return errorResponse(res, 'No email associated with this Google account', 400);
        }

        const normalizedEmail = email.trim().toLowerCase();
        const firstName = given_name || (name ? name.split(' ')[0] : 'User');
        const lastName = family_name || (name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '');

        // 3. Find or create user in MongoDB
        let user = await User.findOne({
            $or: [
                { email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
                { googleId: googleId }
            ]
        });

        if (user) {
            let updated = false;
            if (!user.googleId) {
                user.googleId = googleId;
                updated = true;
            }
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
                updated = true;
            }
            if (!user.firstname && firstName) {
                user.firstname = firstName;
                updated = true;
            }
            if (!user.lastname && lastName) {
                user.lastname = lastName;
                updated = true;
            }
            user.lastSeen = new Date();
            await user.save();
        } else {
            user = await User.create({
                email: normalizedEmail,
                firstname: firstName,
                lastname: lastName,
                avatar: picture || '',
                googleId: googleId,
                authProvider: 'google',
                role: 'USER',
                lastSeen: new Date()
            });
        }

        // 4. Generate JWT session token
        const payload = {
            id: user._id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            avatar: user.avatar || picture || '',
        };

        const token = tokengenerate(payload);

        return successResponse(res, 'Google login successful', { data: payload, token });
    } catch (error) {
        console.error('Error in googleAuthCallback:', error);
        return errorResponse(res, 'Server error during Google authentication', 500, error.message);
    }
};