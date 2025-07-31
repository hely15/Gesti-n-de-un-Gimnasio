const { ObjectId } = require("mongodb")

class NutritionPlan {
  constructor(data) {
    this.validateData(data)

    this._id = data._id || new ObjectId()
    this.clientId = new ObjectId(data.clientId)
    this.contractId = new ObjectId(data.contractId)
    this.name = data.name
    this.description = data.description
    this.dailyCalories = data.dailyCalories
    this.macros = data.macros || {}
    this.meals = data.meals || []
    this.restrictions = data.restrictions || []
    this.isActive = data.isActive !== undefined ? data.isActive : true
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

    // Validar nombre
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 3) {
      errors.push("El nombre del plan debe tener al menos 3 caracteres")
    }

    // Validar calorías diarias
    if (
      !data.dailyCalories ||
      typeof data.dailyCalories !== "number" ||
      data.dailyCalories < 800 ||
      data.dailyCalories > 5000
    ) {
      errors.push("Las calorías diarias deben estar entre 800 y 5000")
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
      name: this.name,
      description: this.description,
      dailyCalories: this.dailyCalories,
      macros: this.macros,
      meals: this.meals,
      restrictions: this.restrictions,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  addMeal(meal) {
    if (!meal.name || !meal.foods || !Array.isArray(meal.foods)) {
      throw new Error("La comida debe tener nombre y lista de alimentos")
    }

    this.meals.push({
      id: new ObjectId(),
      name: meal.name,
      time: meal.time || "",
      foods: meal.foods,
      totalCalories: this.calculateMealCalories(meal.foods),
    })

    this.updatedAt = new Date()
  }

  calculateMealCalories(foods) {
    return foods.reduce((total, food) => total + (food.calories || 0), 0)
  }

  setMacros(protein, carbs, fats) {
    if (protein + carbs + fats !== 100) {
      throw new Error("Los macronutrientes deben sumar 100%")
    }

    this.macros = {
      protein: protein,
      carbs: carbs,
      fats: fats,
    }

    this.updatedAt = new Date()
  }
}

module.exports = NutritionPlan
