const { ObjectId } = require("mongodb")

class Contract {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.clientId = new ObjectId(data.clientId)
    this.planId = new ObjectId(data.planId)
    this.startDate = new Date(data.startDate)
    this.endDate = new Date(data.endDate)
    this.price = data.price
    this.terms = data.terms || this.generateDefaultTerms()
    this.status = data.status || "active" // active, completed, cancelled
    this.paymentSchedule = data.paymentSchedule || "monthly" // monthly, weekly, full
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = new Date()
  }

  validateData(data) {
    const errors = []

    // Validar clientId
    if (!data.clientId || !ObjectId.isValid(data.clientId)) {
      errors.push("ID de cliente inválido")
    }

    // Validar planId
    if (!data.planId || !ObjectId.isValid(data.planId)) {
      errors.push("ID de plan inválido")
    }

    // Validar fechas
    if (!data.startDate || isNaN(new Date(data.startDate).getTime())) {
      errors.push("Fecha de inicio inválida")
    }

    if (!data.endDate || isNaN(new Date(data.endDate).getTime())) {
      errors.push("Fecha de fin inválida")
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.push("La fecha de inicio debe ser anterior a la fecha de fin")
    }

    // Validar precio
    if (!data.price || typeof data.price !== "number" || data.price <= 0) {
      errors.push("El precio debe ser un número mayor a 0")
    }

    // Validar estado
    const validStatuses = ["active", "completed", "cancelled"]
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push("Estado debe ser: active, completed, o cancelled")
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }
  }

  generateDefaultTerms() {
    return [
      "El cliente se compromete a asistir regularmente a las sesiones programadas.",
      "El pago debe realizarse puntualmente según el cronograma acordado.",
      "El gimnasio se reserva el derecho de cancelar el contrato por incumplimiento.",
      "Las cancelaciones deben notificarse con 48 horas de anticipación.",
      "El cliente debe informar cualquier condición médica relevante.",
      "El gimnasio no se hace responsable por lesiones causadas por mal uso del equipo.",
    ]
  }

  toJSON() {
    return {
      _id: this._id,
      clientId: this.clientId,
      planId: this.planId,
      startDate: this.startDate,
      endDate: this.endDate,
      price: this.price,
      terms: this.terms,
      status: this.status,
      paymentSchedule: this.paymentSchedule,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  isActive() {
    const now = new Date()
    return this.status === "active" && now >= this.startDate && now <= this.endDate
  }

  isExpired() {
    return new Date() > this.endDate
  }

  getDaysRemaining() {
    const now = new Date()
    const diffTime = this.endDate - now
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  cancel() {
    this.status = "cancelled"
    this.updatedAt = new Date()
  }

  complete() {
    this.status = "completed"
    this.updatedAt = new Date()
  }
}

module.exports = Contract

