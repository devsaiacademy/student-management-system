import z from "zod";

export const courseInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
});

export type CourseInput = z.infer<typeof courseInputSchema>;
