const { ObjectId } = require("mongodb")

class FinancialRecord {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.type = data.type // income, expense
    this.category = data.category
    this.amount = data.amount
    this.description = data.description
    this.date = new Date(data.date)
    this.clientId = data.clientId ? new ObjectId(data.clientId) : null
    this.contractId = data.contractId ? new ObjectId(data.contractId) : null
    this.paymentMethod = data.paymentMethod || "cash"
    this.reference = data.reference || ""
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = new Date()
  }

  validateData(data) {
    const errors = []

    // Validar tipo
    const validTypes = ["income", "expense"]
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push("El tipo debe ser: income o expense")
    }

    // Validar categoría
    if (!data.category || typeof data.category !== "string" || data.category.trim().length < 2) {
      errors.push("La categoría debe tener al menos 2 caracteres")
    }

    // Validar monto
    if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
      errors.push("El monto debe ser un número mayor a 0")
    }

    // Validar descripción
    if (!data.description || typeof data.description !== "string" || data.description.trim().length < 3) {
      errors.push("La descripción debe tener al menos 3 caracteres")
    }

    // Validar fecha
    if (!data.date || isNaN(new Date(data.date).getTime())) {
      errors.push("Fecha inválida")
    }

    // Validar método de pago
    const validPaymentMethods = ["cash", "card", "transfer", "check"]
    if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
      errors.push("Método de pago debe ser: cash, card, transfer, o check")
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }
  }

  toJSON() {
    return {
      _id: this._id,
      type: this.type,
      category: this.category,
      amount: this.amount,
      description: this.description,
      date: this.date,
      clientId: this.clientId,
      contractId: this.contractId,
      paymentMethod: this.paymentMethod,
      reference: this.reference,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  isIncome() {
    return this.type === "income"
  }

  isExpense() {
    return this.type === "expense"
  }

  getFormattedAmount() {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(this.amount)
  }
}

module.exports = FinancialRecord
