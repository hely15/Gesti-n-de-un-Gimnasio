const { ObjectId } = require("mongodb")

class PhysicalTracking {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.clientId = new ObjectId(data.clientId)
    this.contractId = new ObjectId(data.contractId)
    this.date = new Date(data.date)
    this.weight = data.weight
    this.bodyFat = data.bodyFat
    this.muscleMass = data.muscleMass
    this.measurements = data.measurements || {}
    this.photos = data.photos || []
    this.notes = data.notes || ""
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = new Date()
  }

  validateData(data) {
    const errors = []

    // Validar clientId
    if (!data.clientId || !ObjectId.isValid(data.clientId)) {
      errors.push("ID de cliente inválido")
    }

    // Validar contractId
    if (!data.contractId || !ObjectId.isValid(data.contractId)) {
      errors.push("ID de contrato inválido")
    }

    // Validar fecha
    if (!data.date || isNaN(new Date(data.date).getTime())) {
      errors.push("Fecha inválida")
    }

    // Validar peso
    if (data.weight !== undefined && (typeof data.weight !== "number" || data.weight <= 0 || data.weight > 300)) {
      errors.push("El peso debe ser un número entre 0 y 300 kg")
    }

    // Validar grasa corporal
    if (data.bodyFat !== undefined && (typeof data.bodyFat !== "number" || data.bodyFat < 0 || data.bodyFat > 50)) {
      errors.push("El porcentaje de grasa corporal debe estar entre 0 y 50%")
    }

    // Validar masa muscular
    if (
      data.muscleMass !== undefined &&
      (typeof data.muscleMass !== "number" || data.muscleMass < 0 || data.muscleMass > 100)
    ) {
      errors.push("El porcentaje de masa muscular debe estar entre 0 y 100%")
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }
  }

  toJSON() {
    return {
      _id: this._id,
      clientId: this.clientId,
      contractId: this.contractId,
      date: this.date,
      weight: this.weight,
      bodyFat: this.bodyFat,
      muscleMass: this.muscleMass,
      measurements: this.measurements,
      photos: this.photos,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  addMeasurement(bodyPart, value) {
    if (!bodyPart || typeof value !== "number" || value <= 0) {
      throw new Error("Medida inválida")
    }

    this.measurements[bodyPart] = value
    this.updatedAt = new Date()
  }

  addPhoto(photoPath, description = "") {
    this.photos.push({
      id: new ObjectId(),
      path: photoPath,
      description: description,
      uploadedAt: new Date(),
    })
    this.updatedAt = new Date()
  }

  removePhoto(photoId) {
    this.photos = this.photos.filter((photo) => photo.id.toString() !== photoId.toString())
    this.updatedAt = new Date()
  }
}

module.exports = PhysicalTracking
