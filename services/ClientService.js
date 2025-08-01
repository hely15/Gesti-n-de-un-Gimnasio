const Client = require("../models/Client")
const ClientRepository = require("../repositories/ClientRepository")
const ContractRepository = require("../repositories/ContractRepository")
const DatabaseConnection = require("../config/database")
const { ObjectId } = require("mongodb")

class ClientService {
  constructor() {
    this.clientRepository = new ClientRepository()
    this.contractRepository = new ContractRepository()
  }

  async createClient(clientData) {
    try {
      // Validar que el email no exista
      const existingEmail = await this.clientRepository.findByEmail(clientData.email)
      if (existingEmail) {
        throw new Error("Ya existe un cliente con este email")
      }

      // Validar que el teléfono no exista
      const existingPhone = await this.clientRepository.findByPhone(clientData.phone)
      if (existingPhone) {
        throw new Error("Ya existe un cliente con este teléfono")
      }

      const client = new Client(clientData)
      const clientId = await this.clientRepository.create(client.toJSON())

      return await this.clientRepository.findById(clientId)
    } catch (error) {
      throw new Error(`Error creando cliente: ${error.message}`)
    }
  }

  async getAllClients(options = {}) {
    try {
      const { status, search, limit, skip } = options

      if (search) {
        return await this.clientRepository.searchClients(search)
      }

      const filter = status ? { status } : {}
      const queryOptions = {}

      if (limit) queryOptions.limit = limit
      if (skip) queryOptions.skip = skip

      return await this.clientRepository.findAll(filter, queryOptions)
    } catch (error) {
      throw new Error(`Error obteniendo clientes: ${error.message}`)
    }
  }

  async getClientById(clientId) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      const client = await this.clientRepository.findById(new ObjectId(clientId))
      if (!client) {
        throw new Error("Cliente no encontrado")
      }

      return client
    } catch (error) {
      throw new Error(`Error obteniendo cliente: ${error.message}`)
    }
  }

  async updateClient(clientId, updateData) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      // Verificar que el cliente existe
      const existingClient = await this.clientRepository.findById(new ObjectId(clientId))
      if (!existingClient) {
        throw new Error("Cliente no encontrado")
      }

      // Si se actualiza email, verificar que no exista
      if (updateData.email && updateData.email !== existingClient.email) {
        const emailExists = await this.clientRepository.findByEmail(updateData.email)
        if (emailExists) {
          throw new Error("Ya existe un cliente con este email")
        }
      }

      // Si se actualiza teléfono, verificar que no exista
      if (updateData.phone && updateData.phone !== existingClient.phone) {
        const phoneExists = await this.clientRepository.findByPhone(updateData.phone)
        if (phoneExists) {
          throw new Error("Ya existe un cliente con este teléfono")
        }
      }

      const updated = await this.clientRepository.update(new ObjectId(clientId), updateData)
      if (!updated) {
        throw new Error("No se pudo actualizar el cliente")
      }

      return await this.clientRepository.findById(new ObjectId(clientId))
    } catch (error) {
      throw new Error(`Error actualizando cliente: ${error.message}`)
    }
  }

  async deleteClient(clientId) {
    const session = DatabaseConnection.client.startSession()

    try {
      await session.withTransaction(async () => {
        if (!ObjectId.isValid(clientId)) {
          throw new Error("ID de cliente inválido")
        }

        const clientObjectId = new ObjectId(clientId)

        // Verificar que el cliente existe
        const client = await this.clientRepository.findById(clientObjectId)
        if (!client) {
          throw new Error("Cliente no encontrado")
        }

        // Verificar si tiene contratos activos
        const activeContracts = await this.contractRepository.findByFilter({
          clientId: clientObjectId,
          status: "active",
        })

        if (activeContracts.length > 0) {
          throw new Error("No se puede eliminar un cliente con contratos activos")
        }

        // Cancelar contratos pendientes
        const pendingContracts = await this.contractRepository.findByClientId(clientObjectId)
        for (const contract of pendingContracts) {
          await this.contractRepository.updateStatus(contract._id, "cancelled", session)
        }

        // Eliminar cliente
        const deleted = await this.clientRepository.delete(clientObjectId, session)
        if (!deleted) {
          throw new Error("No se pudo eliminar el cliente")
        }
      })

      return true
    } catch (error) {
      throw new Error(`Error eliminando cliente: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async getClientWithContracts(clientId) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      const result = await this.clientRepository.getClientWithContracts(clientId)
      if (result.length === 0) {
        throw new Error("Cliente no encontrado")
      }

      return result[0]
    } catch (error) {
      throw new Error(`Error obteniendo cliente con contratos: ${error.message}`)
    }
  }

  async getClientsStats() {
    try {
      return await this.clientRepository.getClientsStats()
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`)
    }
  }

  async deactivateClient(clientId) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      const updated = await this.clientRepository.updateStatus(new ObjectId(clientId), "inactive")
      if (!updated) {
        throw new Error("No se pudo desactivar el cliente")
      }

      return await this.clientRepository.findById(new ObjectId(clientId))
    } catch (error) {
      throw new Error(`Error desactivando cliente: ${error.message}`)
    }
  }

  async reactivateClient(clientId) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      const updated = await this.clientRepository.updateStatus(new ObjectId(clientId), "active")
      if (!updated) {
        throw new Error("No se pudo reactivar el cliente")
      }

      return await this.clientRepository.findById(new ObjectId(clientId))
    } catch (error) {
      throw new Error(`Error reactivando cliente: ${error.message}`)
    }
  }
}

module.exports = ClientService
