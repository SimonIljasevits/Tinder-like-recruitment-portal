using Backend_jobby.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Check if data already exists
        if (await context.Jobs.AnyAsync())
        {
            return;
        }

        // 1. Create a demo Employer user
        var employerUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "employer@recruitment.ee",
            PasswordHash = "demo_hash",
            Role = "Employer"
        };
        context.Users.Add(employerUser);

        var employerProfile = new EmployerProfile
        {
            Id = Guid.NewGuid(),
            UserId = employerUser.Id,
            FullName = "Tööandja Juht",
            CompanyName = "CleanSpace Care",
            CompanyInitials = "CS",
            Phone = "+372 5000 0000"
        };
        context.EmployerProfiles.Add(employerProfile);

        // 2. Create demo Jobseeker (Kadri Lepik from prototype)
        var jobseekerUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "kadri.lepik@example.ee",
            PasswordHash = "demo_hash",
            Role = "Jobseeker"
        };
        context.Users.Add(jobseekerUser);

        var jobseekerProfile = new JobseekerProfile
        {
            Id = Guid.NewGuid(),
            UserId = jobseekerUser.Id,
            FullName = "Kadri Lepik",
            Phone = "+372 5512 3487",
            City = "Tallinn, Kristiine",
            MinHourlyPay = 7.00m,
            Summary = "Experienced cleaner looking for part-time evening work. I work carefully and independently, and I'm used to following a fixed checklist.",
            Availability = "Available Mon, Wed, Fri evenings from 17:00. I can start within two weeks.",
            Conditions = "I lift up to 10 kg. I need step-free access. I prefer a low-noise environment.",
            Skills = new List<JobseekerSkill>
            {
                new() { SkillCode = "commercial" },
                new() { SkillCode = "floor" }
            },
            Accommodations = new List<JobseekerAccommodation>
            {
                new() { AccommodationCode = "max10" },
                new() { AccommodationCode = "stepfree" }
            },
            Schedules = new List<JobseekerSchedule>
            {
                new() { ScheduleCode = "evening" },
                new() { ScheduleCode = "parttime" }
            },
            Experiences = new List<JobseekerExperience>
            {
                new()
                {
                    RoleTitle = "Cleaner",
                    Organization = "Büroohaldus OÜ",
                    Period = "2023–2026",
                    Description = "Evening cleaning of three office buildings, 4-hour shifts. Responsible for ordering supplies for my own sites."
                },
                new()
                {
                    RoleTitle = "Assistant",
                    Organization = "Hansa Pesumaja",
                    Period = "2021–2023",
                    Description = "Sorting and packing linen, loading industrial machines."
                }
            }
        };
        context.JobseekerProfiles.Add(jobseekerProfile);

        // 3. Seed demo jobs matching frontend data
        var jobs = new List<Job>
        {
            new()
            {
                EmployerProfileId = employerProfile.Id,
                CompanyName = "CleanSpace Care",
                CompanyInitials = "CS",
                Title = "Commercial night cleaner",
                HourlyPay = 7.00m,
                PrimarySkill = "commercial",
                Location = "Ülemiste City, Tallinn",
                DistanceKm = 2.5m,
                WorkingHours = "Mon, Wed, Fri 18:00–22:00",
                StartDateText = "By agreement, ideally within 2 weeks",
                Description = "You clean two office floors in the Ülemiste business quarter after staff have left. The work follows a fixed checklist: bins, desk surfaces, kitchens, toilets and corridors. You work alone or with one colleague, and nobody rushes you.",
                FirstMessage = "Hi! Saw your profile. We need someone 3 evenings a week at the Ülemiste office building.",
                Shifts = new() { new() { ShiftCode = "night" }, new() { ShiftCode = "evening" } },
                Accommodations = new() { new() { AccommodationCode = "max10" }, new() { AccommodationCode = "stepfree" }, new() { AccommodationCode = "lownoise" } },
                Requirements = new() { new() { RequirementText = "Commercial experience" }, new() { RequirementText = "Estonian or Russian" } },
                Offers = new() { new() { OfferText = "Workwear and equipment provided" }, new() { OfferText = "€30/month travel allowance" }, new() { OfferText = "Paid twice a month" } }
            },
            new()
            {
                EmployerProfileId = employerProfile.Id,
                CompanyName = "Büroohaldus OÜ",
                CompanyInitials = "BH",
                Title = "Morning office cleaner",
                HourlyPay = 8.20m,
                PrimarySkill = "commercial",
                Location = "Tallinn city centre, 3 sites",
                DistanceKm = 1.2m,
                WorkingHours = "Mon–Fri 6:00–9:00",
                StartDateText = "As soon as possible",
                Description = "A morning round through three downtown offices before the working day starts. Each building takes about an hour. You get keys and access cards on day one.",
                FirstMessage = "Hello! We have a morning round open downtown. Would 6–9 work for you?",
                Shifts = new() { new() { ShiftCode = "morning" }, new() { ShiftCode = "parttime" } },
                Accommodations = new() { new() { AccommodationCode = "max10" }, new() { AccommodationCode = "stepfree" }, new() { AccommodationCode = "nochem" } },
                Requirements = new() { new() { RequirementText = "6–9 am" }, new() { RequirementText = "Works independently" } },
                Offers = new() { new() { OfferText = "Final schedule by agreement" }, new() { OfferText = "Fragrance-free products" }, new() { OfferText = "A proper employment contract" } }
            },
            new()
            {
                EmployerProfileId = employerProfile.Id,
                CompanyName = "Polaris Hoolduskeskus",
                CompanyInitials = "PH",
                Title = "Floor care technician",
                HourlyPay = 9.50m,
                PrimarySkill = "floor",
                Location = "Sites across Harju county",
                DistanceKm = 6.8m,
                WorkingHours = "Mon–Thu 22:00–06:00",
                StartDateText = "October",
                Description = "You maintain floors in large retail and production spaces: scrubber, polisher, waxing. Machine training happens on site.",
                FirstMessage = "Hi! We're looking for someone with floor machine experience.",
                Shifts = new() { new() { ShiftCode = "night" } },
                Accommodations = new() { new() { AccommodationCode = "mask" }, new() { AccommodationCode = "stepfree" }, new() { AccommodationCode = "max10" } },
                Requirements = new() { new() { RequirementText = "Machine experience" }, new() { RequirementText = "Night shift" } },
                Offers = new() { new() { OfferText = "On-site machine training" }, new() { OfferText = "+25% night shift premium" }, new() { OfferText = "Dust mask and ear defenders provided" } }
            },
            new()
            {
                EmployerProfileId = employerProfile.Id,
                CompanyName = "Keskuse Kaubamaja",
                CompanyInitials = "KK",
                Title = "Shopping centre day cleaner",
                HourlyPay = 7.50m,
                PrimarySkill = "commercial",
                Location = "Shopping centre, Tallinn",
                DistanceKm = 3.4m,
                WorkingHours = "4-hour shifts, rota published 2 weeks ahead",
                StartDateText = "Immediately",
                Description = "You keep the centre's common areas in order through the day: floors, bins, glass doors and the food court. The work is visible and among customers.",
                FirstMessage = "Hi! We have an opening on the day team, 4-hour shifts.",
                Shifts = new() { new() { ShiftCode = "morning" }, new() { ShiftCode = "evening" }, new() { ShiftCode = "parttime" } },
                Accommodations = new() { new() { AccommodationCode = "stepfree" }, new() { AccommodationCode = "lownoise" }, new() { AccommodationCode = "sitting" }, new() { AccommodationCode = "max10" } },
                Requirements = new() { new() { RequirementText = "Customer-facing" }, new() { RequirementText = "Light physical work" } },
                Offers = new() { new() { OfferText = "Meal discount in the centre" }, new() { OfferText = "A seated break every 2 hours" }, new() { OfferText = "You can choose your shift length" } }
            },
            new()
            {
                EmployerProfileId = employerProfile.Id,
                CompanyName = "Hansa Pesumaja",
                CompanyInitials = "HP",
                Title = "Laundry operator",
                HourlyPay = 8.00m,
                PrimarySkill = "laundry",
                Location = "Peetri, Rae municipality",
                DistanceKm = 4.1m,
                WorkingHours = "Mon–Fri 7:00–15:30",
                StartDateText = "By agreement",
                Description = "You load and unload industrial washing machines, then sort and pack hotel linen. Most of the work happens at one table, sitting or standing.",
                FirstMessage = "Hi! We're hiring full-time for the laundry.",
                Shifts = new() { new() { ShiftCode = "morning" }, new() { ShiftCode = "fulltime" } },
                Accommodations = new() { new() { AccommodationCode = "stepfree" }, new() { AccommodationCode = "max10" }, new() { AccommodationCode = "sitting" } },
                Requirements = new() { new() { RequirementText = "Shift work" }, new() { RequirementText = "Full-time" } },
                Offers = new() { new() { OfferText = "Full-time with a fixed schedule" }, new() { OfferText = "Free transport from Tallinn" }, new() { OfferText = "Hot lunch on site" } }
            }
        };

        context.Jobs.AddRange(jobs);
        await context.SaveChangesAsync();
    }
}
