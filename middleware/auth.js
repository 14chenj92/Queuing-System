function requireAdminAuth(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  res.redirect("/admin-login.html");
}
module.exports = { requireAdminAuth };