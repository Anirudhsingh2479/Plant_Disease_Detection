const jwt = require('jsonwebtoken');

const getTokenFromRequest = (req) => {
    const cookieToken = req.cookies?.token;
    if (cookieToken) return cookieToken;

    const queryToken = req.query?.access_token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
        return queryToken.trim();
    }

    const authHeader = req.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    return null;
};

const requireAuth = (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        res.set('Cache-Control', 'no-store');
        return res.status(401).json({
            success: false,
            message: "Please login or signup to get your plant's diagnosis!"
        });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // decoded is just a standard object containing the user's ID
        req.user = decoded;
        //req.user = decoded —takes this object and attaches it to the incoming request
        // If the token is valid, the decoded payload (which typically contains user information) is attached to the req.user property. 
        // This allows subsequent middleware or route handlers to access the authenticated user's information.
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.set('Cache-Control', 'no-store');
        return res.status(401).json({
            success: false,
            message: "Session expired. Please login again"
        });
    }
};

module.exports = { requireAuth };