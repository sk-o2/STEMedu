const User = require('../models/User');
const Course = require('../models/Course');
const Project = require('../models/Project');
const ChatSession = require('../models/ChatSession');

// @desc Get admin dashboard stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCourses, totalProjects, totalSessions, recentUsers, recentCourses, tutors, students] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Project.countDocuments(),
      ChatSession.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar isVerified'),
      Course.find().sort({ createdAt: -1 }).limit(5).populate('instructor', 'name').select('title category level isPublished createdAt studentsEnrolled'),
      User.countDocuments({ role: 'tutor' }),
      User.countDocuments({ role: 'student' }),
    ]);
    res.status(200).json({
      success: true,
      stats: { totalUsers, totalCourses, totalProjects, totalSessions, tutors, students },
      recentUsers,
      recentCourses,
    });
  } catch (err) { next(err); }
};

// @desc Get all users (paginated, searchable, filterable)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password -resetPasswordToken -emailVerificationToken');
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), users });
  } catch (err) { next(err); }
};

// @desc Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) { next(err); }
};

// @desc Update user info (admin can edit name, email, bio, avatar)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, bio, avatar, isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, bio, avatar, isVerified },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Get all courses (admin — includes unpublished)
exports.getAllCourses = async (req, res, next) => {
  try {
    const { search, category, isPublished, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    if (category && category !== 'all') query.category = category;
    if (isPublished !== undefined && isPublished !== 'all') query.isPublished = isPublished === 'true';
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructor', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), courses });
  } catch (err) { next(err); }
};

// @desc Get course sales and revenue analytics (admin)
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email avatar')
      .select('title category price discountPrice isFree studentsEnrolled isPublished createdAt thumbnail rating');

    let totalRevenue = 0;
    let totalSales = 0;
    let paidSales = 0;
    let freeEnrollments = 0;

    const courseStats = courses.map(c => {
      const salesCount = c.studentsEnrolled ? c.studentsEnrolled.length : 0;
      const effectivePrice = c.isFree ? 0 : (c.discountPrice || c.price || 0);
      const revenue = salesCount * effectivePrice;

      totalSales += salesCount;
      if (c.isFree) {
        freeEnrollments += salesCount;
      } else {
        paidSales += salesCount;
        totalRevenue += revenue;
      }

      return {
        _id: c._id,
        title: c.title,
        category: c.category,
        isFree: c.isFree,
        price: c.price,
        discountPrice: c.discountPrice,
        effectivePrice,
        salesCount,
        revenue,
        isPublished: c.isPublished,
        createdAt: c.createdAt,
        thumbnail: c.thumbnail,
        instructor: c.instructor,
        rating: c.rating,
      };
    });

    courseStats.sort((a, b) => b.revenue - a.revenue || b.salesCount - a.salesCount);

    const categoryStatsMap = {};
    courseStats.forEach(item => {
      if (!categoryStatsMap[item.category]) {
        categoryStatsMap[item.category] = { category: item.category, coursesCount: 0, salesCount: 0, revenue: 0 };
      }
      categoryStatsMap[item.category].coursesCount += 1;
      categoryStatsMap[item.category].salesCount += item.salesCount;
      categoryStatsMap[item.category].revenue += item.revenue;
    });

    const categoryStats = Object.values(categoryStatsMap).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        totalSales,
        paidSales,
        freeEnrollments,
        totalCoursesCount: courses.length,
        courseStats,
        categoryStats,
      },
    });
  } catch (err) { next(err); }
};


// @desc Get single course by ID (admin)
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name avatar email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Create course (admin)
exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.body.instructor || req.user.id;
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Update course (admin)
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('instructor', 'name avatar email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, course });
  } catch (err) { next(err); }
};

// @desc Delete course (admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (err) { next(err); }
};

// @desc Get all projects (admin — includes unpublished)
exports.getAllProjects = async (req, res, next) => {
  try {
    const { search, category, isPublished, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    if (category && category !== 'all') query.category = category;
    if (isPublished !== undefined && isPublished !== 'all') query.isPublished = isPublished === 'true';
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('createdBy', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), projects });
  } catch (err) { next(err); }
};

// @desc Get single project by ID (admin)
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name avatar email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Create project (admin)
exports.createProject = async (req, res, next) => {
  try {
    req.body.createdBy = req.body.createdBy || req.user.id;
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Update project (admin)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name avatar email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Delete project (admin)
exports.deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) { next(err); }
};
