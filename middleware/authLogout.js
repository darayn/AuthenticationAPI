const authLogout = (req, res, next) => {
    try {
        res.clearCookie("token");
        res.json({
            message : "User Signout Successfully"
        });
    } catch (error) {
        console.log(error);
    }
    return next();
}


module.exports = authLogout;