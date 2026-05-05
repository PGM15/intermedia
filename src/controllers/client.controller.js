import Client from '../models/client.model.js';
import AppError from '../utils/appError.js';

export const createClient = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.company;

  const existingClient = await Client.findOne({
    cif: req.body.cif,
    company: companyId,
  });

  if (existingClient) {
    throw AppError.conflict('Client with this CIF already exists in your company');
  }

  const client = await Client.create({
    ...req.body,
    user: userId,
    company: companyId,
  });

  const io = req.app.get("io");
  io?.to(companyId.toString()).emit("client:new", {
    message: "Nuevo cliente creado",
    client,
  });

  res.status(201).json({
    status: 'success',
    message: 'Client created successfully',
    data: client,
  });
};

export const getClients = async (req, res) => {
  const companyId = req.user.company;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { name, sort } = req.query;

  const filter = {
    company: companyId,
    deleted: false,
  };

  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }

  const sortOption = sort || 'createdAt';

  const [clients, totalItems] = await Promise.all([
    Client.find(filter).sort(sortOption).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    status: 'success',
    results: clients.length,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    },
    data: clients,
  });
};

export const getArchivedClients = async (req, res) => {
  const companyId = req.user.company;

  const clients = await Client.find({
    company: companyId,
    deleted: true,
  }).sort('-updatedAt');

  res.status(200).json({
    status: 'success',
    results: clients.length,
    data: clients,
  });
};

export const getClientById = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const client = await Client.findOne({
    _id: id,
    company: companyId,
  });

  if (!client) {
    throw AppError.notFound('Client not found');
  }

  res.status(200).json({
    status: 'success',
    data: client,
  });
};

export const updateClient = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const client = await Client.findOne({
    _id: id,
    company: companyId,
    deleted: false,
  });

  if (!client) {
    throw AppError.notFound('Client not found');
  }

  if (req.body.cif && req.body.cif !== client.cif) {
    const existingClient = await Client.findOne({
      cif: req.body.cif,
      company: companyId,
      _id: { $ne: id },
    });

    if (existingClient) {
      throw AppError.conflict('Another client with this CIF already exists in your company');
    }
  }

  Object.assign(client, req.body);
  await client.save();

  res.status(200).json({
    status: 'success',
    message: 'Client updated successfully',
    data: client,
  });
};

export const deleteClient = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;
  const { soft } = req.query;

  const client = await Client.findOne({
    _id: id,
    company: companyId,
  });

  if (!client) {
    throw AppError.notFound('Client not found');
  }

  if (soft === 'true') {
    client.deleted = true;
    await client.save();

    return res.status(200).json({
      status: 'success',
      message: 'Client archived successfully',
    });
  }

  await Client.deleteOne({ _id: id, company: companyId });

  res.status(200).json({
    status: 'success',
    message: 'Client deleted permanently',
  });
};

export const restoreClient = async (req, res) => {
  const companyId = req.user.company;
  const { id } = req.params;

  const client = await Client.findOne({
    _id: id,
    company: companyId,
    deleted: true,
  });

  if (!client) {
    throw AppError.notFound('Archived client not found');
  }

  client.deleted = false;
  await client.save();

  res.status(200).json({
    status: 'success',
    message: 'Client restored successfully',
    data: client,
  });
};
