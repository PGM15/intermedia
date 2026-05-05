import DeliveryNote from "../models/deliverynote.model.js";
import Client from "../models/client.model.js";
import Project from "../models/project.model.js";
import AppError from "../utils/appError.js";
import sharp from "sharp";
import { generateDeliveryNotePdfBuffer } from "../services/pdf.service.js";
import { uploadImageBuffer, uploadPdfBuffer } from "../services/storage.service.js";

export const createDeliveryNote = async (req, res) => {
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

  const project = await Project.findOne({
    _id: req.body.project,
    company: companyId,
    deleted: false,
  });

  if (!project) {
    throw AppError.notFound("Project not found in your company");
  }

  if (project.client.toString() !== req.body.client) {
    throw AppError.badRequest("Project does not belong to the provided client");
  }

  if (req.body.format === "material") {
    const { material, quantity, unit } = req.body;

    if (!material || quantity === undefined || !unit) {
      throw AppError.badRequest(
        "For material delivery notes, material, quantity and unit are required"
      );
    }
  }

  if (req.body.format === "hours") {
    const hasHours = req.body.hours !== undefined;
    const hasWorkers =
      Array.isArray(req.body.workers) && req.body.workers.length > 0;

    if (!hasHours && !hasWorkers) {
      throw AppError.badRequest(
        "For hours delivery notes, hours or workers are required"
      );
    }
  }

  const deliveryNote = await DeliveryNote.create({
    ...req.body,
    user: userId,
    company: companyId,
    workDate: new Date(req.body.workDate),
  });

  const io = req.app.get("io");
  io?.to(companyId.toString()).emit("deliverynote:new", {
    message: "Nuevo albarán creado",
    deliveryNote,
  });

  res.status(201).json({
    status: "success",
    message: "Delivery note created successfully",
    data: deliveryNote,
  });
};

export const getDeliveryNotes = async (req, res) => {
  const companyId = req.user.company;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { project, client, format, signed, from, to, sort } = req.query;

  const filter = {
    company: companyId,
    deleted: false,
  };

  if (project) filter.project = project;
  if (client) filter.client = client;
  if (format) filter.format = format;
  if (signed !== undefined) filter.signed = signed === "true";

  if (from || to) {
    filter.workDate = {};
    if (from) filter.workDate.$gte = new Date(from);
    if (to) filter.workDate.$lte = new Date(to);
  }

  const sortOption = sort || "-workDate";

  const [deliveryNotes, totalItems] = await Promise.all([
    DeliveryNote.find(filter)
      .populate("client", "name cif")
      .populate("project", "name projectCode")
      .populate("user", "name lastName email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    DeliveryNote.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    status: "success",
    results: deliveryNotes.length,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    },
    data: deliveryNotes,
  });
};

export const getDeliveryNoteById = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const deliveryNote = await DeliveryNote.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  })
    .populate("user", "name lastName email")
    .populate("client")
    .populate("project");

  if (!deliveryNote) {
    throw AppError.notFound("Delivery note not found");
  }

  res.status(200).json({
    status: "success",
    data: deliveryNote,
  });
};

export const updateDeliveryNote = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const deliveryNote = await DeliveryNote.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  });

  if (!deliveryNote) {
    throw AppError.notFound("Delivery note not found");
  }

  if (deliveryNote.signed) {
    throw AppError.badRequest("Signed delivery notes cannot be modified");
  }

  const nextClient = req.body.client || deliveryNote.client.toString();
  const nextProject = req.body.project || deliveryNote.project.toString();

  if (req.body.client) {
    const client = await Client.findOne({
      _id: nextClient,
      company: companyId,
      deleted: false,
    });

    if (!client) {
      throw AppError.notFound("Client not found in your company");
    }
  }

  const project = await Project.findOne({
    _id: nextProject,
    company: companyId,
    deleted: false,
  });

  if (!project) {
    throw AppError.notFound("Project not found in your company");
  }

  if (project.client.toString() !== nextClient) {
    throw AppError.badRequest("Project does not belong to the provided client");
  }

  const merged = {
    ...deliveryNote.toObject(),
    ...req.body,
    client: nextClient,
    project: nextProject,
  };

  if (merged.format === "material") {
    if (!merged.material || merged.quantity === undefined || !merged.unit) {
      throw AppError.badRequest(
        "For material delivery notes, material, quantity and unit are required"
      );
    }
  }

  if (merged.format === "hours") {
    const hasHours = merged.hours !== undefined;
    const hasWorkers =
      Array.isArray(merged.workers) && merged.workers.length > 0;

    if (!hasHours && !hasWorkers) {
      throw AppError.badRequest(
        "For hours delivery notes, hours or workers are required"
      );
    }
  }

  Object.assign(deliveryNote, req.body);

  if (req.body.workDate) {
    deliveryNote.workDate = new Date(req.body.workDate);
  }

  await deliveryNote.save();

  res.status(200).json({
    status: "success",
    message: "Delivery note updated successfully",
    data: deliveryNote,
  });
};

export const deleteDeliveryNote = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const deliveryNote = await DeliveryNote.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  });

  if (!deliveryNote) {
    throw AppError.notFound("Delivery note not found");
  }

  if (deliveryNote.signed) {
    throw AppError.badRequest("Signed delivery notes cannot be deleted");
  }

  await DeliveryNote.deleteOne({ _id: id, company: companyId });

  res.status(200).json({
    status: "success",
    message: "Delivery note deleted successfully",
  });
};

export const signDeliveryNote = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const deliveryNote = await DeliveryNote.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  })
    .populate("user", "name lastName email")
    .populate("client", "name cif email phone address")
    .populate("project", "name projectCode address email notes");

  if (!deliveryNote) {
    throw AppError.notFound("Delivery note not found");
  }

  if (deliveryNote.signed) {
    throw AppError.badRequest("Delivery note is already signed");
  }

  if (!req.file) {
    throw AppError.badRequest("Signature image is required");
  }

  const optimizedSignatureBuffer = await sharp(req.file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const pdfSignatureBuffer = await sharp(req.file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .png()
    .toBuffer();

  const uploadedSignature = await uploadImageBuffer(
    optimizedSignatureBuffer,
    "bildyapp/signatures"
  );

  deliveryNote.signed = true;
  deliveryNote.signedAt = new Date();
  deliveryNote.signatureUrl = uploadedSignature.url;

  const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote, {
    signatureBuffer: pdfSignatureBuffer,
  });
  const uploadedPdf = await uploadPdfBuffer(pdfBuffer, "bildyapp/pdfs");

  deliveryNote.pdfUrl = uploadedPdf.url;

  await deliveryNote.save();

  const io = req.app.get("io");
  io?.to(companyId.toString()).emit("deliverynote:signed", {
    message: "Albarán firmado",
    deliveryNote,
  });

  res.status(200).json({
    status: "success",
    message: "Delivery note signed successfully",
    data: deliveryNote,
  });
};

export const downloadDeliveryNotePdf = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const deliveryNote = await DeliveryNote.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  })
    .populate("user", "name lastName email")
    .populate("client", "name cif email phone address")
    .populate("project", "name projectCode address email notes");

  if (!deliveryNote) {
    throw AppError.notFound("Delivery note not found");
  }

  if (deliveryNote.signed && deliveryNote.pdfUrl) {
    return res.redirect(deliveryNote.pdfUrl);
  }

  const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="deliverynote-${deliveryNote._id}.pdf"`
  );

  return res.send(pdfBuffer);
};
