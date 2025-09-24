const { verifyToken } = require("../utils/auth");

const retrieveUser = () => {
    return (req, res, next) => {
        const token = req.cookies?.token;
        if (!token) {
            req.email = null;
            req.id = null;
            req.role = null;
            return next();
        }
        const payload = verifyToken(token);
        req.email = payload.email;
        req.id = payload.id;
        req.role = payload.role;
        return next();
    };
}

const authenticate = () => {
    return (req, res, next) => {
        if (!req.email || !req.id) {
            return res.redirect("/login");
        }
        next();
    };
}

const userAlreadyLoggedIn = () => {
    return (req, res, next) => {
        if (req.email) {
            return res.redirect("/");
        }
        next();
    };
}

const checkPermission = (role) => {
    return (req, res, next) => {
        if(!req.email){
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!role.includes(req.role)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        next();
    };
}

module.exports = {
    retrieveUser,
    authenticate,
    userAlreadyLoggedIn,
    checkPermission
};
