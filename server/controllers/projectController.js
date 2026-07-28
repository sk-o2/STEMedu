const Project = require('../models/Project');
const User = require('../models/User');

// @desc Get all projects
exports.getProjects = async (req, res, next) => {
  try {
    const { category, difficulty, search, isFree, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isFree !== undefined) query.isFree = isFree === 'true';
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .select('-steps')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), projects });
  } catch (err) { next(err); }
};

// @desc Get single project
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isPublished: true })
      .populate('createdBy', 'name avatar')
      .populate('relatedProjects', 'title thumbnail slug difficulty');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.views += 1;
    await project.save();
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Create project
exports.createProject = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Update project
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
};

// @desc Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
};

// @desc Like / Unlike project
exports.toggleLike = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const liked = project.likes.includes(req.user.id);
    if (liked) project.likes.pull(req.user.id);
    else project.likes.push(req.user.id);
    await project.save();
    res.status(200).json({ success: true, liked: !liked, totalLikes: project.likes.length });
  } catch (err) { next(err); }
};

// @desc Bookmark project
exports.toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const isBookmarked = user.bookmarkedProjects.includes(req.params.id);
    if (isBookmarked) user.bookmarkedProjects.pull(req.params.id);
    else user.bookmarkedProjects.push(req.params.id);
    await user.save();
    res.status(200).json({ success: true, bookmarked: !isBookmarked });
  } catch (err) { next(err); }
};

// @desc Get featured projects
exports.getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ isPublished: true })
      .select('-steps')
      .sort({ views: -1 })
      .limit(6);
    res.status(200).json({ success: true, projects });
  } catch (err) { next(err); }
};
