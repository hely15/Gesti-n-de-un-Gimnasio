const BaseRepository = require("./BaseRepository")
const { ObjectId } = require("mongodb")

class ClientRepository extends BaseRepository {
  constructor() {
    super("clients")
  }

  async findByEmail(email) {
    const collection = await this.getCollection()
    return await collection.findOne({ email: email })
  }

  async findByPhone(phone) {
    const collection = await this.getCollection()
    return await collection.findOne({ phone: phone })
  }

  async findActiveClients() {
    return await this.findByFilter({ status: "active" })
  }

  async searchClients(searchTerm) {
    const collection = await this.getCollection()
    const regex = new RegExp(searchTerm, "i")

    return await collection
      .find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }],
      })
      .toArray()
  }

  async getClientWithContracts(clientId) {
    const collection = await this.getCollection()

    return await collection
      .aggregate([
        { $match: { _id: new ObjectId(clientId) } },
        {
          $lookup: {
            from: "contracts",
            localField: "_id",
            foreignField: "clientId",
            as: "contracts",
          },
        },
        {
          $lookup: {
            from: "training_plans",
            localField: "contracts.planId",
            foreignField: "_id",
            as: "plans",
          },
        },
      ])
      .toArray()
  }

  async getClientsStats() {
    const collection = await this.getCollection()

    return await collection
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()
  }

  async updateStatus(clientId, status, session = null) {
    return await this.update(clientId, { status }, session)
  }
}

module.exports = ClientRepository
