const TrainingPlan = require("../models/TrainingPlan")
const TrainingPlanRepository = require("../repositories/TrainingPlanRepository")
const ContractRepository = require("../repositories/ContractRepository")
const DatabaseConnection = require("../config/database")
const { ObjectId } = require("mongodb")

class TrainingPlanService {
  constructor() {
    this.planRepository = new TrainingPlanRepository()
    this.contractRepository = new ContractRepository()
  }

  async createPlan(planData) {
    try {
      const plan = new TrainingPlan(planData)
      const planId = await this.planRepository.create(plan.toJSON())

      return await this.planRepository.findById(planId)
    } catch (error) {
      throw new Error(`Error creando plan: ${error.message}`)
    }
  }

  async getAllPlans(options = {}) {
    try {
      const { level, active, search, minPrice, maxPrice, limit, skip } = options

      if (search) {
        return await this.planRepository.searchPlans(search)
      }

      if (minPrice !== undefined && maxPrice !== undefined) {
        return await this.planRepository.findByPriceRange(minPrice, maxPrice)
      }

      if (level) {
        return await this.planRepository.findByLevel(level)
      }

      const filter = active !== undefined ? { isActive: active } : {}
      const queryOptions = {}

      if (limit) queryOptions.limit = limit
      if (skip) queryOptions.skip = skip

      return await this.planRepository.findAll(filter, queryOptions)
    } catch (error) {
      throw new Error(`Error obteniendo planes: ${error.message}`)
    }
  }

  async getPlanById(planId) {
    try {
      if (!ObjectId.isValid(planId)) {
        throw new Error("ID de plan inválido")
      }

      const plan = await this.planRepository.findById(new ObjectId(planId))
      if (!plan) {
        throw new Error("Plan no encontrado")
      }

      return plan
    } catch (error) {
      throw new Error(`Error obteniendo plan: ${error.message}`)
    }
  }

  async updatePlan(planId, updateData) {
    try {
      if (!ObjectId.isValid(planId)) {
        throw new Error("ID de plan inválido")
      }

      // Verificar que el plan existe
      const existingPlan = await this.planRepository.findById(new ObjectId(planId))
      if (!existingPlan) {
        throw new Error("Plan no encontrado")
      }

      const updated = await this.planRepository.update(new ObjectId(planId), updateData)
      if (!updated) {
        throw new Error("No se pudo actualizar el plan")
      }

      return await this.planRepository.findById(new ObjectId(planId))
    } catch (error) {
      throw new Error(`Error actualizando plan: ${error.message}`)
    }
  }

  async deletePlan(planId) {
    const session = DatabaseConnection.client.startSession()

    try {
      await session.withTransaction(async () => {
        if (!ObjectId.isValid(planId)) {
          throw new Error("ID de plan inválido")
        }

        const planObjectId = new ObjectId(planId)

        // Verificar que el plan existe
        const plan = await this.planRepository.findById(planObjectId)
        if (!plan) {
          throw new Error("Plan no encontrado")
        }

        // Verificar si tiene contratos activos
        const activeContracts = await this.contractRepository.findByFilter({
          planId: planObjectId,
          status: "active",
        })

        if (activeContracts.length > 0) {
          throw new Error("No se puede eliminar un plan con contratos activos")
        }

        // Cancelar contratos pendientes
        const pendingContracts = await this.contractRepository.findByPlanId(planObjectId)
        for (const contract of pendingContracts) {
          await this.contractRepository.updateStatus(contract._id, "cancelled", session)
        }

        // Eliminar plan
        const deleted = await this.planRepository.delete(planObjectId, session)
        if (!deleted) {
          throw new Error("No se pudo eliminar el plan")
        }
      })

      return true
    } catch (error) {
      throw new Error(`Error eliminando plan: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async getPlanWithClients(planId) {
    try {
      if (!ObjectId.isValid(planId)) {
        throw new Error("ID de plan inválido")
      }

      const result = await this.planRepository.getPlanWithClients(planId)
      if (result.length === 0) {
        throw new Error("Plan no encontrado")
      }

      return result[0]
    } catch (error) {
      throw new Error(`Error obteniendo plan con clientes: ${error.message}`)
    }
  }

  async getPlansStats() {
    try {
      return await this.planRepository.getPlansStats()
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`)
    }
  }

  async deactivatePlan(planId) {
    const session = DatabaseConnection.client.startSession()

    try {
      await session.withTransaction(async () => {
        if (!ObjectId.isValid(planId)) {
          throw new Error("ID de plan inválido")
        }

        const planObjectId = new ObjectId(planId)

        // Verificar contratos activos
        const activeContracts = await this.contractRepository.findByFilter({
          planId: planObjectId,
          status: "active",
        })

        if (activeContracts.length > 0) {
          throw new Error("No se puede desactivar un plan con contratos activos")
        }

        const updated = await this.planRepository.deactivatePlan(planObjectId, session)
        if (!updated) {
          throw new Error("No se pudo desactivar el plan")
        }
      })

      return await this.planRepository.findById(new ObjectId(planId))
    } catch (error) {
      throw new Error(`Error desactivando plan: ${error.message}`)
    } finally {
      await session.endSession()
    }
  }

  async reactivatePlan(planId) {
    try {
      if (!ObjectId.isValid(planId)) {
        throw new Error("ID de plan inválido")
      }

      const updated = await this.planRepository.update(new ObjectId(planId), { isActive: true })
      if (!updated) {
        throw new Error("No se pudo reactivar el plan")
      }

      return await this.planRepository.findById(new ObjectId(planId))
    } catch (error) {
      throw new Error(`Error reactivando plan: ${error.message}`)
    }
  }
}

module.exports = TrainingPlanService
