const jwt = require('jsonwebtoken');

const getAccessTokenSecret = () => (
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
);

const getTokenFromRequest = (req) => {
    const accessTokenCookie = req.cookies?.accessToken;
    if (accessTokenCookie) return accessTokenCookie;

    const authHeader = req.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    const legacyCookie = req.cookies?.token;
    if (legacyCookie) return legacyCookie;

    return null;
};

const requireAuth = (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        res.set('Cache-Control', 'no-store');
        return res.status(401).json({
            success: false,
            code: 'NO_TOKEN',
            message: "Please login or signup to get your plant's diagnosis!"
        });
    }

    try {
        const decoded = jwt.verify(token, getAccessTokenSecret());
        req.user = decoded;
        if (typeof next === 'function') {
            next();
        }
    } catch (error) {
        console.error("Authentication error:", error.message);
        res.set('Cache-Control', 'no-store');
        return res.status(401).json({
            success: false,
            code: 'TOKEN_EXPIRED',
            message: "Session expired. Please login again"
        });
    }
};

module.exports = { requireAuth };
