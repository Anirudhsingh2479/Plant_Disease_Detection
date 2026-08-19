const jwt = require('jsonwebtoken');

const getAccessTokenSecret = () => (
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default_access_secret'
);

const getRefreshTokenSecret = () => (
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'default_refresh_secret')
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

    if (token) {
        try {
            const decoded = jwt.verify(token, getAccessTokenSecret());
            req.user = decoded;
            if (typeof next === 'function') {
                return next();
            }
        } catch (error) {
            // Access token failed or expired - attempt refreshToken auto-healing below
        }
    }

    // Auto-heal using 7-day refreshToken cookie if access token expired
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
            req.user = { userId: decoded.userId, _id: decoded.userId };

            // Issue new fresh accessToken cookie transparently
            const newAccessToken = jwt.sign({ userId: decoded.userId }, getAccessTokenSecret(), { expiresIn: '15m' });
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                path: '/',
                maxAge: 15 * 60 * 1000,
            });

            if (typeof next === 'function') {
                return next();
            }
        } catch (refreshErr) {
            console.error("Refresh token verification failed:", refreshErr.message);
        }
    }

    res.set('Cache-Control', 'no-store');
    return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: "Session expired. Please login again"
    });
};

module.exports = { requireAuth };
