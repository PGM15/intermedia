import Project from "../models/project.model.js";
import Client from "../models/client.model.js";
import AppError from "../utils/appError.js";

export const createProject = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.company;

  const client = await Client.findOne({
    _id: req.body.client,
    company: companyId,
    deleted: false,
  });

  if (!client) {
    throw AppError.notFound("Client not found in your company");
  }

  const existingProject = await Project.findOne({
    projectCode: req.body.projectCode,
    company: companyId,
  });

  if (existingProject) {
    throw AppError.conflict("Project with this code already exists in your company");
  }

  const project = await Project.create({
    ...req.body,
    user: userId,
    company: companyId,
  });

  const io = req.app.get("io");
  io?.to(companyId.toString()).emit("project:new", {
    message: "Nuevo proyecto creado",
    project,
  });

  res.status(201).json({
    status: "success",
    message: "Project created successfully",
    data: project,
  });
};

export const getProjects = async (req, res) => {
  const companyId = req.user.company;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { client, name, active, sort } = req.query;

  const filter = {
    company: companyId,
    deleted: false,
  };

  if (client) {
    filter.client = client;
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  if (active !== undefined) {
    filter.active = active === "true";
  }

  const sortOption = sort || "createdAt";

  const [projects, totalItems] = await Promise.all([
    Project.find(filter)
      .populate("client", "name cif email phone")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    status: "success",
    results: projects.length,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    },
    data: projects,
  });
};

export const getArchivedProjects = async (req, res) => {
  const companyId = req.user.company;

  const projects = await Project.find({
    company: companyId,
    deleted: true,
  })
    .populate("client", "name cif email phone")
    .sort("-updatedAt");

  res.status(200).json({
    status: "success",
    results: projects.length,
    data: projects,
  });
};

export const getProjectById = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const project = await Project.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  }).populate("client", "name cif email phone address");

  if (!project) {
    throw AppError.notFound("Project not found");
  }

  res.status(200).json({
    status: "success",
    data: project,
  });
};

export const updateProject = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const project = await Project.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  });

  if (!project) {
    throw AppError.notFound("Project not found");
  }

  if (req.body.client) {
    const client = await Client.findOne({
      _id: req.body.client,
      company: companyId,
      deleted: false,
    });

    if (!client) {
      throw AppError.notFound("Client not found in your company");
    }
  }

  if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
    const existingProject = await Project.findOne({
      projectCode: req.body.projectCode,
      company: companyId,
      _id: { $ne: id },
    });

    if (existingProject) {
      throw AppError.conflict(
        "Another project with this code already exists in your company"
      );
    }
  }

  Object.assign(project, req.body);
  await project.save();

  res.status(200).json({
    status: "success",
    message: "Project updated successfully",
    data: project,
  });
};

export const deleteProject = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;
  const { soft } = req.query;

  const project = await Project.findOne({
    _id: id,
    company: companyId,
  });

  if (!project) {
    throw AppError.notFound("Project not found");
  }

  if (soft === "true") {
    project.deleted = true;
    await project.save();

    return res.status(200).json({
      status: "success",
      message: "Project archived successfully",
    });
  }

  await Project.deleteOne({ _id: id, company: companyId });

  res.status(200).json({
    status: "success",
    message: "Project deleted permanently",
  });
};

export const restoreProject = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const project = await Project.findOne({
    _id: id,
    company: companyId,
    deleted: true,
  });

  if (!project) {
    throw AppError.notFound("Archived project not found");
  }

  project.deleted = false;
  await project.save();

  res.status(200).json({
    status: "success",
    message: "Project restored successfully",
    data: project,
  });
};
