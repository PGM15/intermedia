import DeliveryNote from "../models/deliverynote.model.js";
import Client from "../models/client.model.js";
import Project from "../models/project.model.js";
import AppError from "../utils/appError.js";
import sharp from "sharp";
import { generateDeliveryNotePdfBuffer } from "../services/pdf.service.js";
import { uploadImageBuffer, uploadPdfBuffer } from "../services/storage.service.js";

export const createDeliveryNote = async (req, res, next) => {
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

    const project = await Project.findOne({
      _id: req.body.project,
      company: companyId,
      deleted: false,
    });

    if (!project) {
      return next(new AppError("Project not found in your company", 404));
    }

    if (project.client.toString() !== req.body.client) {
      return next(
        new AppError("Project does not belong to the provided client", 400)
      );
    }

    if (req.body.format === "material") {
      const { material, quantity, unit } = req.body;

      if (!material || quantity === undefined || !unit) {
        return next(
          new AppError(
            "For material delivery notes, material, quantity and unit are required",
            400
          )
        );
      }
    }

    if (req.body.format === "hours") {
      const hasHours = req.body.hours !== undefined;
      const hasWorkers =
        Array.isArray(req.body.workers) && req.body.workers.length > 0;

      if (!hasHours && !hasWorkers) {
        return next(
          new AppError(
            "For hours delivery notes, hours or workers are required",
            400
          )
        );
      }
    }

    const deliveryNote = await DeliveryNote.create({
      ...req.body,
      user: userId,
      company: companyId,
      workDate: new Date(req.body.workDate),
    });

    res.status(201).json({
      status: "success",
      message: "Delivery note created successfully",
      data: deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const companyId = req.user.company;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { project, client, format, signed, from, to, sort } = req.query;

    const filter = {
      company: companyId,
      deleted: false,
    };

    if (project) {
      filter.project = project;
    }

    if (client) {
      filter.client = client;
    }

    if (format) {
      filter.format = format;
    }

    if (signed !== undefined) {
      filter.signed = signed === "true";
    }

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
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNoteById = async (req, res, next) => {
  try {
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
      return next(new AppError("Delivery note not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    });

    if (!deliveryNote) {
      return next(new AppError("Delivery note not found", 404));
    }

    if (deliveryNote.signed) {
      return next(
        new AppError("Signed delivery notes cannot be deleted", 400)
      );
    }

    await DeliveryNote.deleteOne({ _id: id, company: companyId });

    res.status(200).json({
      status: "success",
      message: "Delivery note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
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
      return next(new AppError("Delivery note not found", 404));
    }

    if (deliveryNote.signed) {
      return next(new AppError("Delivery note is already signed", 400));
    }

    if (!req.file) {
      return next(new AppError("Signature image is required", 400));
    }

    const optimizedSignatureBuffer = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const uploadedSignature = await uploadImageBuffer(
      optimizedSignatureBuffer,
      "bildyapp/signatures"
    );

    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = uploadedSignature.url;

    const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);
    const uploadedPdf = await uploadPdfBuffer(pdfBuffer, "bildyapp/pdfs");

    deliveryNote.pdfUrl = uploadedPdf.url;

    await deliveryNote.save();

    res.status(200).json({
      status: "success",
      message: "Delivery note signed successfully",
      data: deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDeliveryNotePdf = async (req, res, next) => {
  try {
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
      return next(new AppError("Delivery note not found", 404));
    }

    if (deliveryNote.signed && deliveryNote.pdfUrl) {
      return res.status(200).json({
        status: "success",
        pdfUrl: deliveryNote.pdfUrl,
      });
    }

    const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="deliverynote-${deliveryNote._id}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};