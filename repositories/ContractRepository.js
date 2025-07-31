const BaseRepository = require("./BaseRepository")
const { ObjectId } = require("mongodb")

class ContractRepository extends BaseRepository {
  constructor() {
    super("contracts")
  }

  async findByClientId(clientId) {
    return await this.findByFilter({ clientId: new ObjectId(clientId) })
  }

  async findByPlanId(planId) {
    return await this.findByFilter({ planId: new ObjectId(planId) })
  }

  async findActiveContracts() {
    const now = new Date()
    return await this.findByFilter({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
  }

  async findExpiringContracts(days = 7) {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    return await this.findByFilter({
      status: "active",
      endDate: { $gte: now, $lte: futureDate },
    })
  }

  async findExpiredContracts() {
    const now = new Date()
    return await this.findByFilter({
      status: "active",
      endDate: { $lt: now },
    })
  }

  async getContractWithDetails(contractId) {
    const collection = await this.getCollection()

    return await collection
      .aggregate([
        { $match: { _id: new ObjectId(contractId) } },
        {
          $lookup: {
            from: "clients",
            localField: "clientId",
            foreignField: "_id",
            as: "client",
          },
        },
        {
          $lookup: {
            from: "training_plans",
            localField: "planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: "$client" },
        { $unwind: "$plan" },
      ])
      .toArray()
  }

  async updateStatus(contractId, status, session = null) {
    return await this.update(contractId, { status }, session)
  }

  async renewContract(contractId, newEndDate, session = null) {
    return await this.update(
      contractId,
      {
        endDate: newEndDate,
        status: "active",
      },
      session,
    )
  }
}

module.exports = ContractRepository
