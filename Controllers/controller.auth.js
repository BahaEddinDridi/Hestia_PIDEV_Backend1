const passport = require("../Config/passport");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const asyncHandler = require("../Config/asyncHandler");

const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587,
    auth: {
        user: process.env.MAILTRAP_Username,
        pass: process.env.MAILTRAP_Password,
    }, tls: {
        ciphers: 'SSLv3'
    }
});


const loginUser = async (req, res, next) => {
    passport.authenticate(['local'], { session: false }, async (err, user, info) => {
        try {
            if (err || !user) {
                return res.status(401).json({ error: info ? info.message : 'Login failed' });
            }
            const isPasswordValid = await user.isValidPassword(req.body.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // // Clear login attempts upon successful login
            //  user.loginAttempts = [];
            //  await user.save();

            req.login(user, { session: false }, async (error) => {
                if (error) {
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                const { password: hashedPassword, ...currentUser } = user._doc;
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);
                res.cookie('jwt', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 60 * 60 * 1000
                })
                return res.json({ accessToken, currentUser});
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })(req, res, next);
};

const generateAccessToken = (user) => {
    const accessTokenPayload = { username: user.username, role: user.role };
    return jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (user) => {
    const accessTokenPayload = { username: user.username };
    return jwt.sign(accessTokenPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

const refresh = (req, res) => {
    console.error('Refresh token expired 111');
    const cookies = req.cookies
    console.log('Cookies:', cookies);

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })
    console.error('Refresh token expired 1');
    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    console.error('Refresh token expired:', err);
                    return res.status(401).json({ message: 'Refresh token expired' });
                } else {
                    console.error('Invalid refresh token:', err);
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }
            }
            const user = await User.findOne({ username: decoded.username }).exec()

            if (!user) return res.status(401).json({ message: 'Unauthorized' })
            console.error('Refresh token expired:2');
            const { password: hashedPassword, ...currentUser } = user._doc;
            const accessToken = generateAccessToken(user);

            res.json({ accessToken, currentUser })
        })
    )
}

const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204)
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true })
    res.json({ message: 'Cookie cleared' })
}

const protectedRoute = (req, res) => {
    res.json({ user: req.user });
};

const handleLinkedInCallback = async (req, res) => {
    try {
        const authorizationCode = req.body.code;

        const exchangeResponse = await axios.post('LinkedIn Token Endpoint', {
            code: authorizationCode,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: 'http://localhost:3001/auth/linkedin/callback',
            grant_type: 'authorization_code',
        });
        const accessToken = exchangeResponse.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error('Error exchanging code for access token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const emailVerif = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({
            $or: [
                { email: email }, // Check if email matches
                { recoveryEmail: email } // Check if recoveryEmail matches
            ]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const token = jwt.sign({ id: user._id }, "jwt_secret_key", { expiresIn: "30m" });
        const mailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: email,
            subject: 'Reset Password Link',
            html: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333333;
                }
                p {
                    color: #666666;
                    line-height: 1.6;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    color: #999999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Reset Your Password</h1>
                <p>Dear ${user.username},</p>
                <p>Please click the following link to reset your password:</p>
                <p><a href="http://localhost:5173/auth/reset-password/${user._id}/${token}">Reset Password</a></p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>Regards,<br>Your Application Team</p>
            </div>
            <div class="footer">
                This email was sent by Hesita@esprit.com. Please do not reply to this email.
            </div>
        </body>
        </html>
    `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.json({ status: 'Success', message: 'Reset password link sent successfully' });
            }
        });
    } catch (error) {
        console.error('Error verifying user and sending email:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
const resetPassword = async (req, res) => {
    const { _id, token } = req.params;
    const { password } = req.body;

    try {
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = hash;
        await user.save();

        console.log("Password reset successful");
        res.json({ Status: "Success" });
        const mailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: user.email,
            subject: 'Password Update',
            html: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333333;
                }
                p {
                    color: #666666;
                    line-height: 1.6;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    color: #999999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Update</h1>
                <p>Dear ${user.username},</p>
                <p>Your Password has been changed</p>
                <p>Regards,<br>Your Application Team</p>
            </div>
            <div class="footer">
                This email was sent by Hesita@esprit.com. Please do not reply to this email.
            </div>
        </body>
        </html>
    `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.json({ status: 'Success', message: 'Reset password link sent successfully' });
            }
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ Status: "An error occurred while resetting the password" });
    }
};

const updatePassword = async (req, res) => {
    const { userId, newPassword, oldPassword } = req.body;

    try {
        // Find the user by userId
        const user = await User.findById(userId);

        // Check if the old password matches
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid old password' });
        } else {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            user.password = hashedPassword;
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } const mailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: user.email,
            subject: 'Password Update',
            html: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333333;
                }
                p {
                    color: #666666;
                    line-height: 1.6;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    color: #999999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Update</h1>
                <p>Dear ${user.username},</p>
                <p>Your Password has been changed</p>
                <p>Regards,<br>Your Application Team</p>
            </div>
            <div class="footer">
                This email was sent by Hesita@esprit.com. Please do not reply to this email.
            </div>
        </body>
        </html>
    `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.json({ status: 'Success', message: 'Reset password link sent successfully' });
            }
        });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const addRecoveryMail = async (req, res) => {
    const { _id, recoveryEmail } = req.body;
    try {
        // Check if the recovery email is already used as an email or another recovery email
        const existingUser = await User.findOne({
            $or: [{ email: recoveryEmail }, { recoveryEmail: recoveryEmail }]
        });

        if (existingUser && existingUser._id.toString() !== _id) {
            // The recovery email is already in use for another account
            // You may prompt the user for confirmation here
            return res.status(400).json({ error: 'Recovery email already in use for another account. Do you want to proceed?' });
        }

        // If the recovery email is not already in use, proceed with updating the user document
        let user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user document with the recovery email
        user.recoveryEmail = recoveryEmail;
        user = await user.save();

        // Send email to the main email with the recovery email
        const mainMailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: user.email, // Sending email to the main account
            subject: 'Recovery Email',
            html: `
                <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333333;
            }
            p {
                color: #666666;
                line-height: 1.6;
            }
            a {
                color: #007bff;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                color: #999999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Recovery Email</h1>
            <p>Dear ${user.username},</p>
            <p>Your recovery email: ${recoveryEmail}</p>
            <p>If you did not request this change, please ignore this email.</p>
            <p>Regards,<br>Your Application Team</p>
        </div>
        <div class="footer">
            This email was sent by Hesita@esprit.com. Please do not reply to this email.
        </div>
    </body>
</html>
            `,
        };

        // Send email to the recovery email
        const recoveryMailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: recoveryEmail,
            subject: 'Recovery Email Confirmation',
            html: `
               <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333333;
            }
            p {
                color: #666666;
                line-height: 1.6;
            }
            a {
                color: #007bff;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                color: #999999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Recovery Email Confirmation</h1>
            <p>Dear ${user.username},</p>
            <p>You have added ${recoveryEmail} as your recovery email.</p>
            <p>If you did not request this change, please ignore this email.</p>
            <p>Regards,<br>Your Application Team</p>
        </div>
    </body>
</html>

            `,
        };

        // Send both emails
        transporter.sendMail(mainMailOptions, function (error, info) {
            if (error) {
                console.error('Error sending main email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        transporter.sendMail(recoveryMailOptions, function (error, info) {
            if (error) {
                console.error('Error sending recovery email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.json({ status: 'Success', message: 'Recovery email sent successfully' });
            }
        });
    } catch (error) {
        console.error('Error adding recovery email and sending email:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const SecurityQuestion = async (req, res) => {
    const { _id, securityAnswers } = req.body; // Update to securityAnswers
    try {
        const user = await User.findOne({ _id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update only the answers for the security questions
        user.securityAnswers = securityAnswers.map(item => item.answer);

        await user.save();

        res.json({ status: 'Success', message: 'Security answers added successfully' });
        try {
            const mailOptions = {
                from: 'hestia2024.5@outlook.com',
                to: user.email,
                subject: 'Security Question Update',
                html: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333333;
                }
                p {
                    color: #666666;
                    line-height: 1.6;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    color: #999999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Update</h1>
                <p>Dear ${user.username},</p>
                <p>Your Security Question has been changed</p>
                <p>Regards,<br>Your Application Team</p>
            </div>
            <div class="footer">
                This email was sent by Hesita@esprit.com. Please do not reply to this email.
            </div>
        </body>
        </html>
    `,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    return res.json({ status: 'Success', message: 'Reset password link sent successfully' });
                }
            });
        }
        catch (error) {
            console.error('Error adding security answers:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    catch (error) {
        console.error('Error adding security answers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const verifySecurityQuestion = async (req, res) => {
    const { email, securityAnswers } = req.body;

    try {
        const user = await User.findOne({
            $or: [
                { email: email },
                { recoveryEmail: email }
            ]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = securityAnswers.every((item, index) => item.answer === user.securityAnswers[index]);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid security answers' });
        }

        const token = jwt.sign({ id: user._id }, "jwt_secret_key", { expiresIn: "15m" });

        const mailOptions = {
            from: 'hestia2024.5@outlook.com',
            to: email,
            subject: 'Reset Password Link',
            html: `
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333333;
                        }
                        p {
                            color: #666666;
                            line-height: 1.6;
                        }
                        a {
                            color: #007bff;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        .footer {
                            margin-top: 20px;
                            text-align: center;
                            color: #999999;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Reset Your Password</h1>
                        <p>Dear ${user.username},</p>
                        <p>Please click the following link to reset your password:</p>
                        <p><a href="http://localhost:5173/auth/reset-password/${user._id}/${token}">Reset Password</a></p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p>Regards,<br>Your Application Team</p>
                    </div>
                    <div class="footer">
                        This email was sent by Hesita@esprit.com. Please do not reply to this email.
                    </div>
                </body>
                </html>
            `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.json({ status: 'Success', message: 'Reset password link sent successfully' });
            }
        });
    } catch (error) {
        console.error('Error verifying user and sending email:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}; const receiveMail = async (req, res) => {
    const { name, email, content, sendCopy } = req.body;
    const mailOptions = {
        from: 'hestia2024.5@outlook.com',
        to: 'hestia2024.5@outlook.com',
        subject: 'Message ',
        html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #333333;
                    }
                    p {
                        color: #666666;
                        line-height: 1.6;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        color: #999999;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>From ${name}</h1>
                    <p>${content}</p>
                    <p>Regards,<br>Your Application Team</p>
                </div>
                <div class="footer">
                    This email was sent by Hesita@esprit.com. Please do not reply to this email.
                </div>
            </body>
            </html>
        `,
    };

    // If sendCopy is true, send a copy of the message to the sender
    if (sendCopy) {
        mailOptions.cc = email;
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        } else {
            return res.json({ status: 'Success', message: 'Email sent successfully' });
        }
    });
};

////////////////////////////////////////////////Sign Up With Google///////////////////////////////////////////////////

const callBackFromGoogleCompany = async (req, res) => {
    try {
        const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90);
        const { email, firstName, lastName} = req.body;

        const user = await User.findOne({ email });
        if (user) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });
            const { password: hashedPassword, ...currentUser } = user._doc;
            res.status(200).json({ accessToken ,currentUser});
        } else {
            const hashedPassword = await bcrypt.hash(firstName+email, 10);
            const newUser = new User({
                firstName,
                lastName,
                email,
                role: 'professional',
                password: hashedPassword,
                username: firstName+lastName+randomTwoDigitNumber,
            });
            await newUser.save();

            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });

            res.status(200).json({ accessToken ,newUser});
        }
    } catch (error) {
        console.error('Error in callBackFromGoogle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const callBackFromGoogle = async (req, res) => {
    try {
        const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90);
        const { email, firstName, lastName, role} = req.body;

        const user = await User.findOne({ email });
        if (user) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });
            const { password: hashedPassword, ...currentUser } = user._doc;
            res.status(200).json({ accessToken ,currentUser});
        } else {
            const hashedPassword = await bcrypt.hash(firstName+email, 10);
            const newUser = new User({
                firstName,
                lastName,
                email,
                role,
                password: hashedPassword,
                username: firstName+lastName+randomTwoDigitNumber,
            });
            await newUser.save();

            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });

            res.status(200).json({ accessToken ,newUser});
        }
    } catch (error) {
        console.error('Error in callBackFromGoogle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const callBackFromGoogleStudent = async (req, res) => {
    try {
        const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90);
        const { email, firstName, lastName} = req.body;

        const user = await User.findOne({ email });
        if (user) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });
            res.status(200).json({ accessToken ,role:user.role,username:user.username});
        } else {
            const hashedPassword = await bcrypt.hash(firstName+email, 10);
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                username: firstName+lastName+randomTwoDigitNumber,
            });
            await newUser.save();

            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000
            });
            res.status(200).json({ accessToken ,role:"jobSeeker",username:firstName+lastName});
        }
    } catch (error) {
        console.error('Error in callBackFromGoogle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




module.exports = {
    loginUser,
    handleLinkedInCallback,
    protectedRoute,
    refresh,
    logout,
    updatePassword,
    emailVerif,
    resetPassword,
    addRecoveryMail,
    SecurityQuestion,
    verifySecurityQuestion,
    receiveMail,
    callBackFromGoogleCompany,
    callBackFromGoogle,
    callBackFromGoogleStudent,
};