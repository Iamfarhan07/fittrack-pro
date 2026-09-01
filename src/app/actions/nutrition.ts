'use server';

export async function fetchNutritionData(query: string) {
  const apiKey = process.env.CALORIE_NINJAS_API_KEY;

  if (!apiKey) {
    throw new Error('CALORIE_NINJAS_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch nutrition data');
    }

    const data = await response.json();
    return data.items; // Returns an array of matched food items
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    throw error;
  }
}
