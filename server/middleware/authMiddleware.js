const jwt= require('jsonwebtoken');
const requireAuth = (req,res,next) =>{
    const authHeader = req.headers.authorization;// checks for the presence of the Authorization header in the incoming request. 
                                                 // This header typically contains the JWT token in the format
    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(410).json({success: false, 
            message: "Please login or signup to get your plant's diagnosis!"
        });
    }
    const token = authHeader.split(' ')[1]; 
         // extracts the token part from the header by
         //   splitting the string at the space character and taking the second element of the resulting array (index 1).
         //arr[0] will be "Bearer" and arr[1] will be the actual token.

    try{

        const decoded =jwt.verify(token,process.env.JWT_SECRET);
        // decoded is just a standard object containing the user's ID
        req.user=decoded;
        //req.user = decoded —takes this object and attaches it to the incoming request
        // If the token is valid, the decoded payload (which typically contains user information) is attached to the req.user property. 
        // This allows subsequent middleware or route handlers to access the authenticated user's information.
        next();
    } catch(error){
        return res.status(401).json({
            success:false,
            message: "Session expired. Please login again"
        });
    }
};
module.exports= {requireAuth};