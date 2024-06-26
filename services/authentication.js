const JWT = require("jsonwebtoken");
require('dotenv').config();
const secretKey = process.env.JWT_SECRET ;

module.exports.createTokenForUser = (user) => {
    const payload = {
        _id: user._id,
        username : user.username,
        email: user.email,
    };
    const token = JWT.sign(payload, secretKey , { expiresIn: '1h' });
    return token;
}

module.exports.validateToken= (token)=> {
    const payload = JWT.verify(token, secretKey);
    console.log("valid Token : " , payload);
    return payload;
}

