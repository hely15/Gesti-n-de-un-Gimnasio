const { ObjectId } = require("mongodb")

class Client {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.firstName = data.firstName
    this.lastName = data.lastName
    this.email = data.email
    this.phone = data.phone
    this.birthDate = new Date(data.birthDate)
    this.gender = data.gender
    this.emergencyContact = data.emergencyContact
    this.medicalConditions = data.medicalConditions || []
    this.goals = data.goals || []
    this.status = data.status || "active" // active, inactive, suspended
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = new Date()
  }

  validateData(data) {
    const errors = []

    // Validar nombre
    if (!data.firstName || typeof data.firstName !== "string" || data.firstName.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres")
    }

    // Validar apellido
    if (!data.lastName || typeof data.lastName !== "string" || data.lastName.trim().length < 2) {
      errors.push("El apellido debe tener al menos 2 caracteres")
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push("Email inválido")
    }

    // Validar teléfono
    const phoneRegex = /^\+?[\d\s\-$$$$]{10,15}$/
    if (!data.phone || !phoneRegex.test(data.phone)) {
      errors.push("Teléfono inválido")
    }

    // Validar fecha de nacimiento
    if (!data.birthDate || isNaN(new Date(data.birthDate).getTime())) {
      errors.push("Fecha de nacimiento inválida")
    } else {
      const birthDate = new Date(data.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16 || age > 100) {
        errors.push("La edad debe estar entre 16 y 100 años")
      }
    }

    // Validar género
    const validGenders = ["male", "female", "other"]
    if (!data.gender || !validGenders.includes(data.gender)) {
      errors.push("Género debe ser: male, female, o other")
    }

    // Validar contacto de emergencia
    if (!data.emergencyContact || !data.emergencyContact.name || !data.emergencyContact.phone) {
      errors.push("Contacto de emergencia requerido (nombre y teléfono)")
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }
  }

  toJSON() {
    return {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      birthDate: this.birthDate,
      gender: this.gender,
      emergencyContact: this.emergencyContact,
      medicalConditions: this.medicalConditions,
      goals: this.goals,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`
  }

  getAge() {
    const today = new Date()
    const birthDate = new Date(this.birthDate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }
}

module.exports = Client
