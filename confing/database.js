const { MongoClient } = require("mongodb")
require("dotenv").config()

class DatabaseConnection {
  constructor() {
    this.client = null
    this.db = null
    this.uri = process.env.MONGODB_URI
    this.dbName = process.env.DB_NAME
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri, {
        useUnifiedTopology: true,
      })

      await this.client.connect()
      this.db = this.client.db(this.dbName)

      console.log("Conectado exitosamente a MongoDB")

      // Crear índices necesarios
      await this.createIndexes()

      return this.db
    } catch (error) {
      console.error("Error conectando a MongoDB:", error)
      throw error
    }
  }

  async createIndexes() {
    try {
      // Índices para clientes
      await this.db.collection("clients").createIndex({ email: 1 }, { unique: true })
      await this.db.collection("clients").createIndex({ phone: 1 }, { unique: true })

      // Índices para planes
      await this.db.collection("training_plans").createIndex({ name: 1 })

      // Índices para contratos
      await this.db.collection("contracts").createIndex({ clientId: 1 })
      await this.db.collection("contracts").createIndex({ planId: 1 })
      await this.db.collection("contracts").createIndex({ startDate: 1, endDate: 1 })

      // Índices para seguimiento físico
      await this.db.collection("physical_tracking").createIndex({ clientId: 1, date: -1 })

      // Índices para nutrición
      await this.db.collection("nutrition_plans").createIndex({ clientId: 1 })
      await this.db.collection("daily_nutrition").createIndex({ clientId: 1, date: -1 })

      // Índices para finanzas
      await this.db.collection("financial_records").createIndex({ type: 1, date: -1 })
      await this.db.collection("financial_records").createIndex({ clientId: 1 })

      console.log("Índices creados exitosamente")
    } catch (error) {
      console.error("Error creando índices:", error)
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close()
      console.log("Desconectado de MongoDB")
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error("Base de datos no conectada. Llama a connect() primero.")
    }
    return this.db
  }

  async startTransaction() {
    const session = this.client.startSession()
    session.startTransaction()
    return session
  }

  async commitTransaction(session) {
    await session.commitTransaction()
    session.endSession()
  }

  async abortTransaction(session) {
    await session.abortTransaction()
    session.endSession()
  }
}

module.exports = new DatabaseConnection()
