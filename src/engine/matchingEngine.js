/**
 * MicroHaven Deterministic Matching Engine
 * 
 * This module is the SOURCE OF TRUTH for plant selection.
 * No LLM is involved in filtering, scoring, or combination selection.
 * 
 * Pipeline:
 *   1. Load candidates from plants.json
 *   2. Apply hard-constraint filters (reject incompatible plants)
 *   3. Score individual plants against user preferences
 *   4. Generate candidate combinations (2-3 plants)
 *   5. Score combinations for habitat quality
 *   6. Return best combination with full reasoning
 * 
 * SCORING WEIGHTS (individual plant):
 *   sun_match:        30  — sunlight compatibility is critical
 *   moisture_match:   20  — moisture compatibility is important
 *   container_fit:    15  — how well it fits the container size
 *   difficulty_fit:   10  — matches user experience level
 *   space_fit:        10  — physical dimensions vs available space
 *   budget_fit:        5  — cost relative to budget
 *   ecological_value: 10  — bonus for ecological contributions
 *   TOTAL MAX:       100
 */

import plantsData from '../data/plants.json';

// ─── Constants ───────────────────────────────────────────────────────────────

const INDIVIDUAL_WEIGHTS = {
  sun_match: 30,
  moisture_match: 20,
  container_fit: 15,
  difficulty_fit: 10,
  space_fit: 10,
  budget_fit: 5,
  ecological_value: 10,
};

const COMBINATION_WEIGHTS = {
  bloom_complementarity: 25,
  pollinator_diversity: 20,
  ecological_diversity: 20,
  height_complementarity: 20,
  space_feasibility: 10,
  budget_feasibility: 5,
};

// Approximate container diameter from space type
const SPACE_DEFAULTS = {
  balcony: { max_containers: 4, min_dimension_ft: 2 },
  patio: { max_containers: 6, min_dimension_ft: 3 },
  windowsill: { max_containers: 2, min_dimension_ft: 1 },
};

// ─── Helper functions ────────────────────────────────────────────────────────

function arraysOverlap(a, b) {
  if (!a || !b) return false;
  return a.some(item => b.includes(item));
}

function arrayUnion(...arrays) {
  const set = new Set();
  arrays.forEach(arr => {
    if (arr) arr.forEach(item => set.add(item));
  });
  return [...set];
}

function monthName(m) {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[m] || '?';
}

// ─── Step 1: Load candidates ────────────────────────────────────────────────

export function loadPlants() {
  return plantsData;
}

// ─── Step 2: Hard-constraint filtering ──────────────────────────────────────

/**
 * @param {Object} constraints - User constraints
 * @param {string} constraints.sunlight - "full_sun" | "part_sun" | "shade"
 * @param {string} constraints.moisture - "dry" | "moderate" | "wet"
 * @param {number} constraints.width_ft
 * @param {number} constraints.depth_ft
 * @param {number} constraints.budget
 * @param {string} constraints.experience - "beginner" | "intermediate"
 * @param {string} constraints.space_type - "balcony" | "patio" | "windowsill"
 * @returns {{ passed: Object[], rejected: { plant: Object, reasons: string[] }[] }}
 */
export function filterPlants(plants, constraints) {
  const passed = [];
  const rejected = [];

  const availableAreaSqFt = constraints.width_ft * constraints.depth_ft;
  const maxDimensionFt = Math.max(constraints.width_ft, constraints.depth_ft);

  for (const plant of plants) {
    const reasons = [];

    // Must be native
    if (!plant.native_status) {
      reasons.push('Not native to the region');
    }

    // Must be Willamette Valley
    if (plant.region !== 'Willamette Valley') {
      reasons.push(`Region mismatch: ${plant.region}`);
    }

    // Must be container suitable
    if (!plant.container_suitable) {
      reasons.push('Not suitable for container growing');
    }

    // Sunlight must be compatible
    if (!plant.sun.includes(constraints.sunlight)) {
      reasons.push(`Incompatible sunlight: needs ${plant.sun.join('/')}, space has ${constraints.sunlight}`);
    }

    // Moisture must be compatible
    if (!plant.moisture.includes(constraints.moisture)) {
      reasons.push(`Incompatible moisture: needs ${plant.moisture.join('/')}, space has ${constraints.moisture}`);
    }

    // Plant must physically fit (width check)
    const plantContainerFt = plant.minimum_container_diameter_in / 12;
    if (plantContainerFt > maxDimensionFt) {
      reasons.push(`Container too large: needs ${plant.minimum_container_diameter_in}in diameter, space max is ${(maxDimensionFt * 12).toFixed(0)}in`);
    }

    // Single plant cost must not exceed total budget
    if (plant.estimated_cost_usd > constraints.budget) {
      reasons.push(`Too expensive: $${plant.estimated_cost_usd} exceeds budget of $${constraints.budget}`);
    }

    // Experience check: intermediate plants rejected for beginners
    if (constraints.experience === 'beginner' && plant.difficulty === 'advanced') {
      reasons.push(`Too difficult for ${constraints.experience} gardener`);
    }

    if (reasons.length === 0) {
      passed.push(plant);
    } else {
      rejected.push({ plant, reasons });
    }
  }

  return { passed, rejected };
}

// ─── Step 3: Individual plant scoring ───────────────────────────────────────

export function scorePlant(plant, constraints) {
  const breakdown = {};
  let total = 0;

  // Sun match (0 or full points — already filtered, but reward exact match)
  if (plant.sun.includes(constraints.sunlight)) {
    // Bonus if the plant prefers this sun level (first in list)
    const preference = plant.sun[0] === constraints.sunlight ? 1.0 : 0.8;
    breakdown.sun_match = Math.round(INDIVIDUAL_WEIGHTS.sun_match * preference);
  } else {
    breakdown.sun_match = 0;
  }
  total += breakdown.sun_match;

  // Moisture match
  if (plant.moisture.includes(constraints.moisture)) {
    const preference = plant.moisture[0] === constraints.moisture ? 1.0 : 0.8;
    breakdown.moisture_match = Math.round(INDIVIDUAL_WEIGHTS.moisture_match * preference);
  } else {
    breakdown.moisture_match = 0;
  }
  total += breakdown.moisture_match;

  // Container fit — smaller minimum = easier to fit
  const containerRatio = (plant.minimum_container_diameter_in / 12) / Math.max(constraints.width_ft, constraints.depth_ft);
  const containerScore = Math.max(0, 1 - containerRatio);
  breakdown.container_fit = Math.round(INDIVIDUAL_WEIGHTS.container_fit * containerScore);
  total += breakdown.container_fit;

  // Difficulty fit
  if (plant.difficulty === 'beginner') {
    breakdown.difficulty_fit = INDIVIDUAL_WEIGHTS.difficulty_fit;
  } else if (plant.difficulty === 'intermediate' && constraints.experience === 'intermediate') {
    breakdown.difficulty_fit = INDIVIDUAL_WEIGHTS.difficulty_fit;
  } else if (plant.difficulty === 'intermediate' && constraints.experience === 'beginner') {
    breakdown.difficulty_fit = Math.round(INDIVIDUAL_WEIGHTS.difficulty_fit * 0.5);
  } else {
    breakdown.difficulty_fit = 0;
  }
  total += breakdown.difficulty_fit;

  // Space fit — smaller plants score higher in small spaces
  const areaNeeded = plant.mature_width_ft * plant.mature_width_ft;
  const availableArea = constraints.width_ft * constraints.depth_ft;
  const spaceRatio = areaNeeded / availableArea;
  const spaceScore = Math.max(0, 1 - spaceRatio * 0.5);
  breakdown.space_fit = Math.round(INDIVIDUAL_WEIGHTS.space_fit * spaceScore);
  total += breakdown.space_fit;

  // Budget fit — cheaper relative to budget is better
  const budgetRatio = plant.estimated_cost_usd / constraints.budget;
  const budgetScore = Math.max(0, 1 - budgetRatio);
  breakdown.budget_fit = Math.round(INDIVIDUAL_WEIGHTS.budget_fit * budgetScore);
  total += breakdown.budget_fit;

  // Ecological value bonus
  const ecoCount = (plant.ecological_roles?.length || 0) + (plant.pollinators?.length || 0);
  const ecoScore = Math.min(1, ecoCount / 6);
  breakdown.ecological_value = Math.round(INDIVIDUAL_WEIGHTS.ecological_value * ecoScore);
  total += breakdown.ecological_value;

  return { total, breakdown };
}

// ─── Step 4: Generate combinations ──────────────────────────────────────────

function generateCombinations(plants, minSize = 2, maxSize = 3) {
  const combos = [];

  // Generate pairs
  if (plants.length >= 2) {
    for (let i = 0; i < plants.length; i++) {
      for (let j = i + 1; j < plants.length; j++) {
        combos.push([plants[i], plants[j]]);
      }
    }
  }

  // Generate triples
  if (plants.length >= 3 && maxSize >= 3) {
    for (let i = 0; i < plants.length; i++) {
      for (let j = i + 1; j < plants.length; j++) {
        for (let k = j + 1; k < plants.length; k++) {
          combos.push([plants[i], plants[j], plants[k]]);
        }
      }
    }
  }

  return combos;
}

// ─── Step 5: Combination scoring ────────────────────────────────────────────

export function scoreCombination(combo, individualScores, constraints) {
  const breakdown = {};
  const reasons = [];
  let total = 0;

  // Average individual scores as a base
  const avgIndividual = combo.reduce((sum, p) => sum + individualScores[p.id].total, 0) / combo.length;

  // 1. Bloom complementarity — reward covering more months
  const allBloomMonths = new Set();
  combo.forEach(p => (p.bloom_months || []).forEach(m => allBloomMonths.add(m)));
  const bloomCoverage = allBloomMonths.size / 12;
  breakdown.bloom_complementarity = Math.round(COMBINATION_WEIGHTS.bloom_complementarity * Math.min(1, bloomCoverage * 2));
  if (allBloomMonths.size >= 4) reasons.push(`Bloom coverage spans ${allBloomMonths.size} months (${[...allBloomMonths].sort((a,b)=>a-b).map(monthName).join(', ')})`);
  total += breakdown.bloom_complementarity;

  // 2. Pollinator diversity
  const allPollinators = arrayUnion(...combo.map(p => p.pollinators));
  const pollinatorScore = Math.min(1, allPollinators.length / 5);
  breakdown.pollinator_diversity = Math.round(COMBINATION_WEIGHTS.pollinator_diversity * pollinatorScore);
  if (allPollinators.length >= 3) reasons.push(`Supports ${allPollinators.length} pollinator types`);
  total += breakdown.pollinator_diversity;

  // 3. Ecological role diversity
  const allRoles = arrayUnion(...combo.map(p => p.ecological_roles));
  const ecoScore = Math.min(1, allRoles.length / 5);
  breakdown.ecological_diversity = Math.round(COMBINATION_WEIGHTS.ecological_diversity * ecoScore);
  if (allRoles.length >= 3) reasons.push(`Provides ${allRoles.length} ecological functions`);
  total += breakdown.ecological_diversity;

  // 4. Height/layer complementarity — reward different layers
  const layers = new Set(combo.map(p => p.height_layer));
  const layerScore = layers.size / Math.min(3, combo.length);
  breakdown.height_complementarity = Math.round(COMBINATION_WEIGHTS.height_complementarity * layerScore);
  if (layers.size >= 2) reasons.push(`Height diversity: ${[...layers].join(', ')} layers`);
  total += breakdown.height_complementarity;

  // 5. Space feasibility — total footprint vs available space
  const totalWidth = combo.reduce((sum, p) => sum + p.mature_width_ft, 0);
  const availableWidth = constraints.width_ft;
  const spaceRatio = totalWidth / availableWidth;
  if (spaceRatio <= 1) {
    breakdown.space_feasibility = COMBINATION_WEIGHTS.space_feasibility;
    reasons.push('All plants fit comfortably in the available space');
  } else if (spaceRatio <= 1.5) {
    breakdown.space_feasibility = Math.round(COMBINATION_WEIGHTS.space_feasibility * 0.5);
    reasons.push('Plants will fit with careful arrangement');
  } else {
    breakdown.space_feasibility = 0;
    reasons.push('⚠ Plants may be crowded in the available space');
  }
  total += breakdown.space_feasibility;

  // 6. Budget feasibility
  const totalCost = combo.reduce((sum, p) => sum + p.estimated_cost_usd, 0);
  if (totalCost <= constraints.budget) {
    const budgetRemaining = (constraints.budget - totalCost) / constraints.budget;
    breakdown.budget_feasibility = Math.round(COMBINATION_WEIGHTS.budget_feasibility * (0.5 + budgetRemaining * 0.5));
    reasons.push(`Total cost $${totalCost} within $${constraints.budget} budget`);
  } else {
    breakdown.budget_feasibility = -20; // Heavy penalty
    reasons.push(`⚠ Total cost $${totalCost} exceeds $${constraints.budget} budget`);
  }
  total += breakdown.budget_feasibility;

  // Combine: 60% individual average + 40% combination score
  const finalScore = Math.round(avgIndividual * 0.6 + total * 0.4);

  return {
    plants: combo,
    plantIds: combo.map(p => p.id),
    individualScores: combo.map(p => ({ id: p.id, name: p.common_name, score: individualScores[p.id].total })),
    combinationBreakdown: breakdown,
    combinationScore: total,
    finalScore,
    totalCost,
    reasons,
    bloomMonths: [...allBloomMonths].sort((a, b) => a - b),
    pollinators: allPollinators,
    ecologicalRoles: allRoles,
    heightLayers: [...layers],
  };
}

// ─── Main pipeline ──────────────────────────────────────────────────────────

/**
 * Run the full matching pipeline.
 * 
 * @param {Object} userInput
 * @param {string} userInput.space_type - "balcony" | "patio" | "windowsill"
 * @param {number} userInput.width_ft
 * @param {number} userInput.depth_ft
 * @param {string} userInput.sunlight - "full_sun" | "part_sun" | "shade"
 * @param {string} userInput.moisture - "dry" | "moderate" | "wet"
 * @param {string} userInput.watering - "low" | "moderate" | "frequent"
 * @param {string} userInput.experience - "beginner" | "intermediate"
 * @param {number} userInput.budget
 * 
 * @returns {Object} Full result with reasoning
 */
export function runMatchingPipeline(userInput) {
  const constraints = {
    ...userInput,
    width_ft: Number(userInput.width_ft),
    depth_ft: Number(userInput.depth_ft),
    budget: Number(userInput.budget),
  };

  // Step 1: Load all plants
  const allPlants = loadPlants();

  // Step 2: Hard-constraint filtering
  const { passed, rejected } = filterPlants(allPlants, constraints);

  if (passed.length === 0) {
    return {
      success: false,
      constraints,
      totalPlants: allPlants.length,
      passedFilter: 0,
      rejected: rejected.map(r => ({
        name: r.plant.common_name,
        id: r.plant.id,
        reasons: r.reasons,
      })),
      message: "We couldn't find a habitat that satisfies all your constraints. Try increasing the available space, budget, or adjusting your sunlight/moisture requirements.",
    };
  }

  // Step 3: Score individual plants
  const individualScores = {};
  const scoredPlants = passed.map(plant => {
    const score = scorePlant(plant, constraints);
    individualScores[plant.id] = score;
    return { plant, score };
  });

  // Sort by individual score
  scoredPlants.sort((a, b) => b.score.total - a.score.total);

  // Step 4: Generate combinations
  // Limit to top 8 plants for combination generation to keep it fast
  const topPlants = scoredPlants.slice(0, 8).map(sp => sp.plant);
  const combinations = generateCombinations(topPlants, 2, passed.length >= 3 ? 3 : 2);

  if (combinations.length === 0) {
    // Only one plant passed — return it solo
    if (passed.length === 1) {
      return {
        success: true,
        constraints,
        totalPlants: allPlants.length,
        passedFilter: passed.length,
        rejected: rejected.map(r => ({
          name: r.plant.common_name,
          id: r.plant.id,
          reasons: r.reasons,
        })),
        individualScores: scoredPlants.map(sp => ({
          id: sp.plant.id,
          name: sp.plant.common_name,
          score: sp.score.total,
          breakdown: sp.score.breakdown,
        })),
        recommendation: {
          plants: [passed[0]],
          totalCost: passed[0].estimated_cost_usd,
          finalScore: individualScores[passed[0].id].total,
          reasons: ['Only one plant passed all constraints'],
          bloomMonths: passed[0].bloom_months,
          pollinators: passed[0].pollinators || [],
          ecologicalRoles: passed[0].ecological_roles || [],
          heightLayers: [passed[0].height_layer],
          individualScores: [{ id: passed[0].id, name: passed[0].common_name, score: individualScores[passed[0].id].total }],
          combinationBreakdown: {},
          combinationScore: 0,
        },
      };
    }
    return {
      success: false,
      constraints,
      message: "Not enough compatible plants to form a habitat combination.",
    };
  }

  // Step 5: Score combinations
  const scoredCombinations = combinations
    .map(combo => scoreCombination(combo, individualScores, constraints))
    .filter(sc => sc.totalCost <= constraints.budget) // Hard budget constraint on combination
    .sort((a, b) => b.finalScore - a.finalScore);

  if (scoredCombinations.length === 0) {
    // Combinations exist but none within budget
    return {
      success: false,
      constraints,
      totalPlants: allPlants.length,
      passedFilter: passed.length,
      rejected: rejected.map(r => ({
        name: r.plant.common_name,
        id: r.plant.id,
        reasons: r.reasons,
      })),
      individualScores: scoredPlants.map(sp => ({
        id: sp.plant.id,
        name: sp.plant.common_name,
        score: sp.score.total,
        breakdown: sp.score.breakdown,
      })),
      message: "Individual plants pass the filter, but no combination fits within your budget. Try increasing your budget.",
    };
  }

  // Step 6: Best recommendation
  const best = scoredCombinations[0];

  return {
    success: true,
    constraints,
    totalPlants: allPlants.length,
    passedFilter: passed.length,
    rejected: rejected.map(r => ({
      name: r.plant.common_name,
      id: r.plant.id,
      reasons: r.reasons,
    })),
    individualScores: scoredPlants.map(sp => ({
      id: sp.plant.id,
      name: sp.plant.common_name,
      score: sp.score.total,
      breakdown: sp.score.breakdown,
    })),
    recommendation: best,
    alternativeCombinations: scoredCombinations.slice(1, 4).map(c => ({
      plantIds: c.plantIds,
      plants: c.plants.map(p => p.common_name),
      finalScore: c.finalScore,
      totalCost: c.totalCost,
    })),
  };
}

// ─── Deterministic explanation generator (no LLM needed) ────────────────────

export function generateDeterministicExplanation(result) {
  if (!result.success) {
    return result.message;
  }

  const rec = result.recommendation;
  const plantNames = rec.plants.map(p => p.common_name).join(', ');
  const monthNames = rec.bloomMonths.map(monthName).join(', ');
  const pollinatorNames = rec.pollinators.map(p => p.replace(/_/g, ' ')).join(', ');
  const roleNames = rec.ecologicalRoles.map(r => r.replace(/_/g, ' ')).join(', ');

  let explanation = `Your MicroHaven habitat features ${plantNames} — `;
  explanation += `all native to Oregon's Willamette Valley and suitable for container growing.\n\n`;

  if (rec.bloomMonths.length > 0) {
    explanation += `Together, these plants provide blooms from ${monthNames}, `;
    explanation += `creating a sustained food source for local pollinators.\n\n`;
  }

  if (rec.pollinators.length > 0) {
    explanation += `This combination supports ${pollinatorNames}, `;
    explanation += `contributing to the local pollinator network even in a small urban space.\n\n`;
  }

  if (rec.heightLayers.length > 1) {
    explanation += `The plants create a layered habitat with ${rec.heightLayers.join(' and ')} elements, `;
    explanation += `mimicking natural plant communities and maximizing your space.\n\n`;
  }

  explanation += `Total estimated cost: $${rec.totalCost}, well within your $${result.constraints.budget} budget.`;

  return explanation;
}

export default { runMatchingPipeline, generateDeterministicExplanation, loadPlants };
