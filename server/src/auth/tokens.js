const jwt = require("jsonwebtoken");
const config = require("../config");

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      agencyId: user.agencyId ?? user.agency_id ?? null,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signToken, verifyToken };
