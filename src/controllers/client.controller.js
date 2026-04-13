import Client from '../models/client.model.js';
import AppError from '../utils/appError.js';

export const createClient = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company;

    const existingClient = await Client.findOne({
      cif: req.body.cif,
      company: companyId,
    });

    if (existingClient) {
      return next(new AppError('Client with this CIF already exists in your company', 409));
    }

    const client = await Client.create({
      ...req.body,
      user: userId,
      company: companyId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const client = await Client.findOne({
      _id: id,
      company: companyId,
    });

    if (!client) {
      return next(new AppError('Client not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const client = await Client.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    });

    if (!client) {
      return next(new AppError('Client not found', 404));
    }

    if (req.body.cif && req.body.cif !== client.cif) {
      const existingClient = await Client.findOne({
        cif: req.body.cif,
        company: companyId,
        _id: { $ne: id },
      });

      if (existingClient) {
        return next(new AppError('Another client with this CIF already exists in your company', 409));
      }
    }

    Object.assign(client, req.body);
    await client.save();

    res.status(200).json({
      status: 'success',
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;
    const { soft } = req.query;

    const client = await Client.findOne({
      _id: id,
      company: companyId,
    });

    if (!client) {
      return next(new AppError('Client not found', 404));
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
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { id } = req.params;

    const client = await Client.findOne({
      _id: id,
      company: companyId,
      deleted: true,
    });

    if (!client) {
      return next(new AppError('Archived client not found', 404));
    }

    client.deleted = false;
    await client.save();

    res.status(200).json({
      status: 'success',
      message: 'Client restored successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};