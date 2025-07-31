const { ObjectId } = require("mongodb")

class TrainingPlan {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.name = data.name
    this.description = data.description
    this.duration = data.duration // en semanas
    this.level = data.level // beginner, intermediate, advanced
    this.goals = data.goals || []
    this.exercises = data.exercises || []
    this.price = data.price
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = new Date()
  }

  validateData(data) {
    const errors = []

    // Validar nombre
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 3) {
      errors.push("El nombre del plan debe tener al menos 3 caracteres")
    }

    // Validar descripción
    if (!data.description || typeof data.description !== "string" || data.description.trim().length < 10) {
      errors.push("La descripción debe tener al menos 10 caracteres")
    }

    // Validar duración
    if (!data.duration || typeof data.duration !== "number" || data.duration < 1 || data.duration > 52) {
      errors.push("La duración debe ser entre 1 y 52 semanas")
    }

    // Validar nivel
    const validLevels = ["beginner", "intermediate", "advanced"]
    if (!data.level || !validLevels.includes(data.level)) {
      errors.push("El nivel debe ser: beginner, intermediate, o advanced")
    }

    // Validar precio
    if (!data.price || typeof data.price !== "number" || data.price <= 0) {
      errors.push("El precio debe ser un número mayor a 0")
    }

    // Validar ejercicios si existen
    if (data.exercises && Array.isArray(data.exercises)) {
      data.exercises.forEach((exercise, index) => {
        if (!exercise.name || !exercise.sets || !exercise.reps) {
          errors.push(`Ejercicio ${index + 1}: debe tener nombre, sets y repeticiones`)
        }
      })
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      duration: this.duration,
      level: this.level,
      goals: this.goals,
      exercises: this.exercises,
      price: this.price,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  addExercise(exercise) {
    if (!exercise.name || !exercise.sets || !exercise.reps) {
      throw new Error("El ejercicio debe tener nombre, sets y repeticiones")
    }

    this.exercises.push({
      id: new ObjectId(),
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight || null,
      restTime: exercise.restTime || 60, // segundos
      instructions: exercise.instructions || "",
    })

    this.updatedAt = new Date()
  }

  removeExercise(exerciseId) {
    this.exercises = this.exercises.filter((ex) => ex.id.toString() !== exerciseId.toString())
    this.updatedAt = new Date()
  }
}

module.exports = TrainingPlan
