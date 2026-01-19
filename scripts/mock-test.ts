
// Mock test for plant creation logic
import { z } from "zod";

const plantSchema = z.object({
    name: z.string().min(1),
    strain: z.string().optional(),
    growthStage: z.enum(['seedling', 'vegetative', 'flowering']),
});

async function mockCreatePlant(input: any) {
    try {
        const validated = plantSchema.parse(input);
        console.log("Validation successful:", validated);
        console.log("Simulating DB insert...");
        // Simulate DB failure or success
        return { success: true, plantId: 1 };
    } catch (error) {
        console.error("Validation failed:", error);
        return { success: false, error };
    }
}

mockCreatePlant({
    name: "Test Plant",
    strain: "OG Kush",
    growthStage: "seedling"
});
