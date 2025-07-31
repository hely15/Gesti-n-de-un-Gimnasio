const DatabaseConnection = require("../config/database")

class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName
  }

  async getCollection() {
    const db = DatabaseConnection.getDb()
    return db.collection(this.collectionName)
  }

  async create(document, session = null) {
    const collection = await this.getCollection()
    const options = session ? { session } : {}
    const result = await collection.insertOne(document, options)
    return result.insertedId
  }

  async findById(id, session = null) {
    const collection = await this.getCollection()
    const options = session ? { session } : {}
    return await collection.findOne({ _id: id }, options)
  }

  async findAll(filter = {}, options = {}) {
    const collection = await this.getCollection()
    return await collection.find(filter, options).toArray()
  }

  async update(id, updateData, session = null) {
    const collection = await this.getCollection()
    const options = session ? { session } : {}
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: id }, { $set: updateData }, options)
    return result.modifiedCount > 0
  }

  async delete(id, session = null) {
    const collection = await this.getCollection()
    const options = session ? { session } : {}
    const result = await collection.deleteOne({ _id: id }, options)
    return result.deletedCount > 0
  }

  async findByFilter(filter, options = {}) {
    const collection = await this.getCollection()
    return await collection.find(filter, options).toArray()
  }

  async count(filter = {}) {
    const collection = await this.getCollection()
    return await collection.countDocuments(filter)
  }
}

module.exports = BaseRepository
