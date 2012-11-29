
/*
 * Users API
 */


exports.me = function (req, res, next)  {
  if (!req.isAuthenticated()) { 
      res.statusCode = 401;
      res.send(401);
      return;
  }
  res.json(req.user);
};

