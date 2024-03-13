const User = require("../Models/user")
const jwt = require("jsonwebtoken");
const autoLogin = async (req, res, next) => {
    try {
        const authToken = req.cookies.authToken;

        if (!authToken) {

            return next();
        }


        const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);


        const user = await User.findById(decoded.sub);

        if (!user) {

            return next();
        }


        req.login(user, { session: false }, (error) => {
            if (error) {
                console.error('Auto-login failed:', error);
                return next();
            }


            return next();
        });
    } catch (error) {
        console.error('An unexpected error occurred during auto-login:', error);
        return next();
    }
};

const generateAccessToken = (user) => {
    const accessTokenPayload = { sub: user.username, email: user.email, role: user.role };
    return jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};


module.exports = autoLogin;
