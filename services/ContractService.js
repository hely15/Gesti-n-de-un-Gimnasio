const Contract = require("../models/Contract")
const ContractRepository = require("../repositories/ContractRepository")
const ClientRepository = require("../repositories/ClientRepository")
const TrainingPlanRepository = require("../repositories/TrainingPlanRepository")
const DatabaseConnection = require("../config/database")
const { ObjectId } = require("mongodb")

class ContractService {
  constructor() {
    this.contractRepository = new ContractRepository()
    this.clientRepository = new ClientRepository()
    this.planRepository = new TrainingPlanRepository()
  }

  async assignPlanToClient(clientId, planId, startDate = new Date()) {
    const session = DatabaseConnection.client.startSession()

    try {
      let contract = null

      await session.withTransaction(async () => {
        // Validar IDs
        if (!ObjectId.isValid(clientId) || !ObjectId.isValid(planId)) {
          throw new Error("IDs inválidos")
        }

        const clientObjectId = new ObjectId(clientId)
        const planObjectId = new ObjectId(planId)

        // Verificar que el cliente existe y está activo
        const client = await this.clientRepository.findById(clientObjectId)
        if (!client) {
          throw new Error("Cliente no encontrado")
        }
        if (client.status !== "active") {
          throw new Error("El cliente debe estar activo para asignar un plan")
        }

        // Verificar que el plan existe y está activo
        const plan = await this.planRepository.findById(planObjectId)
        if (!plan) {
          throw new Error("Plan no encontrado")
        }
        if (!plan.isActive) {
          throw new Error("El plan debe estar activo para ser asignado")
        }

        // Verificar que no tenga un contrato activo para el mismo plan
        const existingContract = await this.contractRepository.findByFilter({
          clientId: clientObjectId,
          planId: planObjectId,
          status: "active",
        })

        if (existingContract.length > 0) {
          throw new Error("El cliente ya tiene un contrato activo para este plan")
        }

        // Calcular fecha de fin basada en la duración del plan
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + plan.duration * 7) // duración en semanas

        // Crear contrato
        const contractData = {
          clientId: clientObjectId,
          planId: planObjectId,
          startDate: new Date(startDate),
          endDate: endDate,
          price: plan.price,
          status: "active",
        }

        const contractModel = new Contract(contractData)
        const contractId = await this.contractRepository.create(contractModel.toJSON(), session)

        contract = await this.contractRepository.findById(contractId)
      })

      return contract
    } catch (error) {
      throw new Error(`Error asignando plan: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async getContractById(contractId) {
    try {
      if (!ObjectId.isValid(contractId)) {
        throw new Error("ID de contrato inválido")
      }

      const contract = await this.contractRepository.findById(new ObjectId(contractId))
      if (!contract) {
        throw new Error("Contrato no encontrado")
      }

      return contract
    } catch (error) {
      throw new Error(`Error obteniendo contrato: ${error.message}`)
    }
  }

  async getContractWithDetails(contractId) {
    try {
      if (!ObjectId.isValid(contractId)) {
        throw new Error("ID de contrato inválido")
      }

      const result = await this.contractRepository.getContractWithDetails(contractId)
      if (result.length === 0) {
        throw new Error("Contrato no encontrado")
      }

      return result[0]
    } catch (error) {
      throw new Error(`Error obteniendo detalles del contrato: ${error.message}`)
    }
  }

  async renewContract(contractId, additionalWeeks) {
    const session = DatabaseConnection.client.startSession()

    try {
      let renewedContract = null

      await session.withTransaction(async () => {
        if (!ObjectId.isValid(contractId)) {
          throw new Error("ID de contrato inválido")
        }

        const contractObjectId = new ObjectId(contractId)
        const contract = await this.contractRepository.findById(contractObjectId)

        if (!contract) {
          throw new Error("Contrato no encontrado")
        }

        if (contract.status === "cancelled") {
          throw new Error("No se puede renovar un contrato cancelado")
        }

        // Calcular nueva fecha de fin
        const currentEndDate = new Date(contract.endDate)
        const newEndDate = new Date(currentEndDate)
        newEndDate.setDate(newEndDate.getDate() + additionalWeeks * 7)

        const updated = await this.contractRepository.renewContract(contractObjectId, newEndDate, session)

        if (!updated) {
          throw new Error("No se pudo renovar el contrato")
        }

        renewedContract = await this.contractRepository.findById(contractObjectId)
      })

      return renewedContract
    } catch (error) {
      throw new Error(`Error renovando contrato: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async cancelContract(contractId, reason = "") {
    const session = DatabaseConnection.client.startSession()

    try {
      let cancelledContract = null

      await session.withTransaction(async () => {
        if (!ObjectId.isValid(contractId)) {
          throw new Error("ID de contrato inválido")
        }

        const contractObjectId = new ObjectId(contractId)
        const contract = await this.contractRepository.findById(contractObjectId)

        if (!contract) {
          throw new Error("Contrato no encontrado")
        }

        if (contract.status === "cancelled") {
          throw new Error("El contrato ya está cancelado")
        }

        if (contract.status === "completed") {
          throw new Error("No se puede cancelar un contrato completado")
        }

        // Actualizar estado del contrato
        const updateData = {
          status: "cancelled",
          cancellationReason: reason,
          cancellationDate: new Date(),
        }

        const updated = await this.contractRepository.update(contractObjectId, updateData, session)
        if (!updated) {
          throw new Error("No se pudo cancelar el contrato")
        }

        // TODO: Aquí se podría agregar lógica para rollback de seguimiento físico
        // según los requisitos especiales mencionados

        cancelledContract = await this.contractRepository.findById(contractObjectId)
      })

      return cancelledContract
    } catch (error) {
      throw new Error(`Error cancelando contrato: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async completeContract(contractId) {
    try {
      if (!ObjectId.isValid(contractId)) {
        throw new Error("ID de contrato inválido")
      }

      const contractObjectId = new ObjectId(contractId)
      const contract = await this.contractRepository.findById(contractObjectId)

      if (!contract) {
        throw new Error("Contrato no encontrado")
      }

      if (contract.status !== "active") {
        throw new Error("Solo se pueden completar contratos activos")
      }

      const updateData = {
        status: "completed",
        completionDate: new Date(),
      }

      const updated = await this.contractRepository.update(contractObjectId, updateData)
      if (!updated) {
        throw new Error("No se pudo completar el contrato")
      }

      return await this.contractRepository.findById(contractObjectId)
    } catch (error) {
      throw new Error(`Error completando contrato: ${error.message}`)
    }
  }

  async getActiveContracts() {
    try {
      return await this.contractRepository.findActiveContracts()
    } catch (error) {
      throw new Error(`Error obteniendo contratos activos: ${error.message}`)
    }
  }

  async getExpiringContracts(days = 7) {
    try {
      return await this.contractRepository.findExpiringContracts(days)
    } catch (error) {
      throw new Error(`Error obteniendo contratos por vencer: ${error.message}`)
    }
  }

  async getExpiredContracts() {
    try {
      return await this.contractRepository.findExpiredContracts()
    } catch (error) {
      throw new Error(`Error obteniendo contratos vencidos: ${error.message}`)
    }
  }

  async getContractsByClient(clientId) {
    try {
      if (!ObjectId.isValid(clientId)) {
        throw new Error("ID de cliente inválido")
      }

      return await this.contractRepository.findByClientId(clientId)
    } catch (error) {
      throw new Error(`Error obteniendo contratos del cliente: ${error.message}`)
    }
  }

  async getContractsByPlan(planId) {
    try {
      if (!ObjectId.isValid(planId)) {
        throw new Error("ID de plan inválido")
      }

      return await this.contractRepository.findByPlanId(planId)
    } catch (error) {
      throw new Error(`Error obteniendo contratos del plan: ${error.message}`)
    }
  }
}

module.exports = ContractService
