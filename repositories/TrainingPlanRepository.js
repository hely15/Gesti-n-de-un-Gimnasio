const BaseRepository = require("./BaseRepository")
const { ObjectId } = require("mongodb")

class TrainingPlanRepository extends BaseRepository {
  constructor() {
    super("training_plans")
  }

  async findActivePlans() {
    return await this.findByFilter({ isActive: true })
  }

  async findByLevel(level) {
    return await this.findByFilter({ level: level, isActive: true })
  }

  async findByPriceRange(minPrice, maxPrice) {
    return await this.findByFilter({
      price: { $gte: minPrice, $lte: maxPrice },
      isActive: true,
    })
  }

  async getPlanWithClients(planId) {
    const collection = await this.getCollection()

    return await collection
      .aggregate([
        { $match: { _id: new ObjectId(planId) } },
        {
          $lookup: {
            from: "contracts",
            localField: "_id",
            foreignField: "planId",
            as: "contracts",
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "contracts.clientId",
            foreignField: "_id",
            as: "clients",
          },
        },
      ])
      .toArray()
  }

  async getPlansStats() {
    const collection = await this.getCollection()

    return await collection
      .aggregate([
        {
          $group: {
            _id: "$level",
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" },
            avgDuration: { $avg: "$duration" },
          },
        },
      ])
      .toArray()
  }

  async deactivatePlan(planId, session = null) {
    return await this.update(planId, { isActive: false }, session)
  }

  async searchPlans(searchTerm) {
    const collection = await this.getCollection()
    const regex = new RegExp(searchTerm, "i")

    return await collection
      .find({
        $and: [
          { isActive: true },
          {
            $or: [{ name: regex }, { description: regex }, { level: regex }, { goals: { $in: [regex] } }],
          },
        ],
      })
      .toArray()
  }
}

module.exports = TrainingPlanRepository
