const Application = require("../models/Application");

exports.apply = async (req, res) => {
  const app = await Application.create({
    student: req.user.id,
    scholarship: req.body.scholarshipId
  });
  res.json(app);
};

exports.updateStatus = async (req, res) => {
  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(app);
};
