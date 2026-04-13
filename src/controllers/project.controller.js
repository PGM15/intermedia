import Project from "../models/project.model.js";
import Client from "../models/client.model.js";
import AppError from "../utils/appError.js";

export const createProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company;

    const client = await Client.findOne({
      _id: req.body.client,
      company: companyId,
      deleted: false,
    });

    if (!client) {
      return next(new AppError("Client not found in your company", 404));
    }

    const existingProject = await Project.findOne({
      projectCode: req.body.projectCode,
      company: companyId,
    });

    if (existingProject) {
      return next(
        new AppError("Project with this code already exists in your company", 409)
      );
    }

    const project = await Project.create({
      ...req.body,
      user: userId,
      company: companyId,
    });

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    }).populate("client", "name cif email phone address");

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    });

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    if (req.body.client) {
      const client = await Client.findOne({
        _id: req.body.client,
        company: companyId,
        deleted: false,
      });

      if (!client) {
        return next(new AppError("Client not found in your company", 404));
      }
    }

    if (
      req.body.projectCode &&
      req.body.projectCode !== project.projectCode
    ) {
      const existingProject = await Project.findOne({
        projectCode: req.body.projectCode,
        company: companyId,
        _id: { $ne: id },
      });

      if (existingProject) {
        return next(
          new AppError(
            "Another project with this code already exists in your company",
            409
          )
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
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;
    const { soft } = req.query;

    const project = await Project.findOne({
      _id: id,
      company: companyId,
    });

    if (!project) {
      return next(new AppError("Project not found", 404));
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
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      company: companyId,
      deleted: true,
    });

    if (!project) {
      return next(new AppError("Archived project not found", 404));
    }

    project.deleted = false;
    await project.save();

    res.status(200).json({
      status: "success",
      message: "Project restored successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};