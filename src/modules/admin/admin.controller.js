const adminService = require("./admin.service");

// ================= STATS =================
const getStats = async (req, res) => {
  try {
    const data = await adminService.getAdminStats();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ================= USERS =================
const getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;

    const query = {};
    if (role) query.role = role;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await adminService.getUsers(query);
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await adminService.updateUserRole(id, role);

    res.send({ message: "User role updated" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.deleteUser(id);

    res.send({ message: "User deleted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ================= LESSONS =================
const getLessons = async (req, res) => {
  try {
    const data = await adminService.getLessons(req.query);
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.toggleFeatured(id);

    res.send({ message: "Featured updated" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const markReviewed = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed } = req.body;

    await adminService.markReviewed(id, reviewed);

    res.send({ message: "Reviewed updated" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.deleteLesson(id);

    res.send({ message: "Lesson deleted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ================= REPORTS =================
const getReportedLessons = async (req, res) => {
  try {
    const data = await adminService.getReportedLessons();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const unflagLesson = async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.unflagLesson(id);

    res.send({ message: "Lesson unflagged" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const { email } = req.query;

    const data = await adminService.getAdminProfile(email);
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    await adminService.updateProfile(email, { name, image });

    res.send({ message: "Profile updated" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getLessons,
  toggleFeatured,
  markReviewed,
  deleteLesson,
  getReportedLessons,
  unflagLesson,
  getProfile,
  updateProfile,
};